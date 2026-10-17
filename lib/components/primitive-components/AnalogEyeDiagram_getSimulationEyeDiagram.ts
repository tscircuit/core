import type { SimulationEyeDiagram } from "circuit-json"
import type { AnalogEyeDiagram } from "./AnalogEyeDiagram"
import { resolveExternalTransientSimulation } from "lib/utils/simulation/resolveExternalSimulation"
import type { VoltageProbe } from "./VoltageProbe"

export function AnalogEyeDiagram_getSimulationEyeDiagram(
  declaration: AnalogEyeDiagram,
): Omit<SimulationEyeDiagram, "simulation_eye_diagram_id"> {
  const props = declaration._parsedProps
  const simulation = resolveExternalTransientSimulation({
    declaration,
    selector: props.simulationRef,
  })
  const experiment = simulation.getOrCreateSimulationExperiment()!
  const probes = declaration
    .getSubcircuit()
    .selectAll<VoltageProbe>(props.probeRef)
    .filter((probe) => probe.componentName === "VoltageProbe")
  if (
    probes.length !== 1 ||
    probes[0].getSubcircuit() !== declaration.getSubcircuit()
  ) {
    throw new Error(
      `Eye probe selector "${props.probeRef}" must identify one voltage probe in this subcircuit.`,
    )
  }
  const probe = probes[0]
  if (!probe.simulation_voltage_probe_id) {
    throw new Error(
      `Eye probe "${props.probeRef}" did not render a voltage probe.`,
    )
  }
  const start = props.startTime ?? experiment.start_time_ms ?? 0,
    end = props.endTime ?? experiment.end_time_ms!
  if (
    start < (experiment.start_time_ms ?? 0) ||
    end > experiment.end_time_ms! ||
    end <= start ||
    end - start < 2 * props.unitInterval
  ) {
    throw new Error(
      `Eye "${props.name}" needs a gate within its simulation containing at least two bit intervals.`,
    )
  }
  return {
    type: "simulation_eye_diagram",
    name: props.name,
    simulation_experiment_id: experiment.simulation_experiment_id,
    simulation_voltage_probe_id: probe.simulation_voltage_probe_id!,
    unit_interval_ms: props.unitInterval,
    time_origin_ms: props.timeOrigin,
    start_time_ms: start,
    end_time_ms: end,
  }
}
