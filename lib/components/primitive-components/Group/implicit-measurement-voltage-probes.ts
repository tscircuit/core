import type { AnyCircuitElement, SimulationVoltageProbe } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

const implicitMeasurementProbeIdPrefix = [
  "simulation_voltage_probe",
  "analog_measurement",
  "",
].join("_")

export const getImplicitMeasurementVoltageProbeId = (connectionKey: string) =>
  `${implicitMeasurementProbeIdPrefix}${connectionKey}`

export const isImplicitMeasurementVoltageProbeId = (
  simulationVoltageProbeId?: string | null,
) => simulationVoltageProbeId?.startsWith(implicitMeasurementProbeIdPrefix)

export const addImplicitMeasurementVoltageProbes = (
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const getConnectionKey = (sourcePortOrNetId: string) =>
    connectivityMap.getNetConnectedToId(sourcePortOrNetId) ?? sourcePortOrNetId
  const probedConnectionKeys = new Set<string>()

  for (const circuitElement of circuitJson) {
    if (circuitElement.type !== "simulation_voltage_probe") continue
    const signalSourceId =
      circuitElement.signal_input_source_port_id ??
      circuitElement.signal_input_source_net_id
    if (!signalSourceId) continue
    probedConnectionKeys.add(getConnectionKey(signalSourceId))
  }

  const implicitVoltageProbes: SimulationVoltageProbe[] = []
  for (const circuitElement of circuitJson) {
    if (circuitElement.type === "source_port") {
      const connectionKey = getConnectionKey(circuitElement.source_port_id)
      if (probedConnectionKeys.has(connectionKey)) continue
      probedConnectionKeys.add(connectionKey)
      implicitVoltageProbes.push({
        type: "simulation_voltage_probe",
        simulation_voltage_probe_id:
          getImplicitMeasurementVoltageProbeId(connectionKey),
        name: `analog_measurement_port_${circuitElement.source_port_id}`,
        signal_input_source_port_id: circuitElement.source_port_id,
        subcircuit_id: circuitElement.subcircuit_id,
      })
    }
    if (circuitElement.type === "source_net" && !circuitElement.is_ground) {
      const connectionKey = getConnectionKey(circuitElement.source_net_id)
      if (probedConnectionKeys.has(connectionKey)) continue
      probedConnectionKeys.add(connectionKey)
      implicitVoltageProbes.push({
        type: "simulation_voltage_probe",
        simulation_voltage_probe_id:
          getImplicitMeasurementVoltageProbeId(connectionKey),
        name: `analog_measurement_net_${circuitElement.source_net_id}`,
        signal_input_source_net_id: circuitElement.source_net_id,
        subcircuit_id: circuitElement.subcircuit_id,
      })
    }
  }

  return [...circuitJson, ...implicitVoltageProbes]
}
