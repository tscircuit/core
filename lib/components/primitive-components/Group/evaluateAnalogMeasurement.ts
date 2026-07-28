import type {
  AnalogTransientMeasurementContext,
  TransientMeasurementSeries,
} from "@tscircuit/props"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { Ammeter } from "lib/components/normal-components/Ammeter"
import type { AnalogMeasurement } from "../AnalogMeasurement"
import type { Net } from "../Net"
import type { Port } from "../Port"
import type { VoltageProbe } from "../VoltageProbe"
import type { IGroup } from "./IGroup"
import type { InsertedSimulationGraph } from "./InsertedSimulationGraph"
import { getImplicitMeasurementVoltageProbeId } from "./implicit-measurement-voltage-probes"

type SimulationMeasurementScope = Pick<IGroup, "root" | "selectOne">

const getTimestampsMs = (
  graph:
    | Extract<InsertedSimulationGraph, { type: "voltage" }>["graph"]
    | Extract<InsertedSimulationGraph, { type: "current" }>["graph"],
  sampleCount: number,
) =>
  graph.timestamps_ms ??
  Array.from(
    { length: sampleCount },
    (_, sampleIndex) => graph.start_time_ms + sampleIndex * graph.time_per_step,
  )

const getVoltageProbeId = ({
  selector,
  simulationScope,
}: {
  selector: string
  simulationScope: SimulationMeasurementScope
}) => {
  const selectedComponent = simulationScope.selectOne<VoltageProbe>(selector, {
    type: "voltageprobe",
  })
  if (
    selectedComponent?.componentName === "VoltageProbe" &&
    (selectedComponent as VoltageProbe).simulation_voltage_probe_id
  ) {
    return (selectedComponent as VoltageProbe).simulation_voltage_probe_id
  }

  const selectedPort = simulationScope.selectOne<Port>(selector, {
    type: "port",
  })
  const selectedNet = selectedPort
    ? null
    : (simulationScope.selectOne<Net>(selector, { type: "net" }) ??
      (selector.startsWith("net.")
        ? simulationScope.selectOne<Net>(selector.slice(4), { type: "net" })
        : null))
  const sourcePortId = selectedPort?.source_port_id
  const sourceNetId =
    selectedNet?.source_net_id ??
    (selector.startsWith("net.")
      ? simulationScope.root?.db.source_net
          .list()
          .find((sourceNet) => sourceNet.name === selector.slice(4))
          ?.source_net_id
      : undefined)
  const sourceTargetId = sourcePortId ?? sourceNetId
  const circuitJson = simulationScope.root?.db.toArray() ?? []
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const getConnectionKey = (sourcePortOrNetId: string) =>
    connectivityMap.getNetConnectedToId(sourcePortOrNetId) ?? sourcePortOrNetId
  const targetConnectionKey = sourceTargetId
    ? getConnectionKey(sourceTargetId)
    : undefined
  const matchingProbe =
    simulationScope.root?.db.simulation_voltage_probe.list().find((probe) => {
      const probeSourceId =
        probe.signal_input_source_port_id ?? probe.signal_input_source_net_id
      return (
        probeSourceId !== undefined &&
        targetConnectionKey !== undefined &&
        getConnectionKey(probeSourceId) === targetConnectionKey
      )
    }) ?? null

  if (matchingProbe) {
    return matchingProbe.simulation_voltage_probe_id
  }
  if (targetConnectionKey) {
    return getImplicitMeasurementVoltageProbeId(targetConnectionKey)
  }
  throw new Error(
    `getVoltage("${selector}") could not resolve a voltage-capable port or net.`,
  )
}

const getCurrentProbeId = ({
  selector,
  simulationScope,
}: {
  selector: string
  simulationScope: SimulationMeasurementScope
}) => {
  const selectedComponent = simulationScope.selectOne<Ammeter>(selector, {
    type: "ammeter",
  })
  if (
    selectedComponent?.componentName !== "Ammeter" ||
    !(selectedComponent as Ammeter).simulation_current_probe_id
  ) {
    throw new Error(
      `getCurrent("${selector}") requires an ammeter matching that selector.`,
    )
  }
  return (selectedComponent as Ammeter).simulation_current_probe_id
}

export const evaluateAnalogMeasurement = ({
  analogMeasurement,
  simulationScope,
  simulationGraphs,
}: {
  analogMeasurement: AnalogMeasurement
  simulationScope: SimulationMeasurementScope
  simulationGraphs: InsertedSimulationGraph[]
}) => {
  const context: AnalogTransientMeasurementContext = {
    getVoltage: (selector): TransientMeasurementSeries => {
      const voltageProbeId = getVoltageProbeId({ selector, simulationScope })
      const voltageGraph = simulationGraphs.find(
        (simulationGraph) =>
          simulationGraph.type === "voltage" &&
          simulationGraph.graph.source_probe_id === voltageProbeId,
      )
      if (!voltageGraph || voltageGraph.type !== "voltage") {
        throw new Error(
          `getVoltage("${selector}") could not find a transient result.`,
        )
      }
      return {
        timestampsMs: getTimestampsMs(
          voltageGraph.graph,
          voltageGraph.graph.voltage_levels.length,
        ),
        values: voltageGraph.graph.voltage_levels,
      }
    },
    getCurrent: (selector): TransientMeasurementSeries => {
      const currentProbeId = getCurrentProbeId({ selector, simulationScope })
      const currentGraph = simulationGraphs.find(
        (simulationGraph) =>
          simulationGraph.type === "current" &&
          simulationGraph.graph.source_probe_id === currentProbeId,
      )
      if (!currentGraph || currentGraph.type !== "current") {
        throw new Error(
          `getCurrent("${selector}") could not find a transient result.`,
        )
      }
      return {
        timestampsMs: getTimestampsMs(
          currentGraph.graph,
          currentGraph.graph.current_levels.length,
        ),
        values: currentGraph.graph.current_levels,
      }
    },
  }

  const measurementValue = analogMeasurement._parsedProps.measureFn(context)
  if (!Number.isFinite(measurementValue)) {
    throw new Error(
      `analog.measurement "${analogMeasurement._parsedProps.name}" returned a non-finite value.`,
    )
  }
  return measurementValue
}
