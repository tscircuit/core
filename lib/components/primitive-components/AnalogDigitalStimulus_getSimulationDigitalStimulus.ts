import type { SimulationDigitalStimulus } from "circuit-json"
import type { AnalogDigitalStimulus } from "./AnalogDigitalStimulus"
import {
  resolveExternalSimulationPort,
  resolveExternalTransientSimulation,
} from "lib/utils/simulation/resolveExternalSimulation"

export function AnalogDigitalStimulus_getSimulationDigitalStimulus(
  declaration: AnalogDigitalStimulus,
): Omit<SimulationDigitalStimulus, "simulation_digital_stimulus_id"> {
  const props = declaration._parsedProps
  const simulation = resolveExternalTransientSimulation({
    declaration,
    selector: props.simulationRef,
  })
  const port = resolveExternalSimulationPort({
    declaration,
    selector: props.drives,
  })
  const experiment = simulation.getOrCreateSimulationExperiment()!
  if (props.startTime >= experiment.end_time_ms!)
    throw new Error(`Stimulus "${props.name}" starts outside its simulation.`)
  if (
    declaration
      .root!.db.simulation_digital_stimulus.list({
        simulation_experiment_id: experiment.simulation_experiment_id,
      })
      .some(
        (stimulus) =>
          stimulus.simulation_digital_stimulus_id !==
            declaration.simulation_digital_stimulus_id &&
          (stimulus.source_port_id === port.source_port_id ||
            stimulus.name === props.name),
      )
  ) {
    throw new Error(
      `Stimulus "${props.name}" duplicates a driven pin or stimulus name in this simulation.`,
    )
  }
  return {
    type: "simulation_digital_stimulus",
    name: props.name,
    simulation_experiment_id: experiment.simulation_experiment_id,
    source_port_id: port.source_port_id!,
    unit_interval_ms: props.unitInterval,
    start_time_ms: props.startTime,
    initial_state: props.initialState,
    inverted: props.inverted,
    pattern: props.pattern,
  }
}
