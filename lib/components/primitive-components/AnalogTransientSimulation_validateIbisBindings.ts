import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import type { AnalogTransientSimulation } from "./AnalogTransientSimulation"
import type { IbisModel } from "./IbisModel"

/** SimulationRender has inserted every model before this validation phase. */
export function AnalogTransientSimulation_validateIbisBindings(
  simulation: AnalogTransientSimulation,
): void {
  if (simulation.getSpiceEngineName() !== "pcb_spice") return
  const subcircuit = simulation.getSubcircuit()
  const models = subcircuit
    .selectAll<IbisModel>("ibismodel")
    .filter(
      (model) => !model.shouldBeRemoved && model.getSubcircuit() === subcircuit,
    )
    .map(
      (model) =>
        simulation.root!.db.simulation_ibis_model.get(
          model.simulation_ibis_model_id!,
        )!,
    )
  for (const selector of Object.keys(
    simulation._parsedProps.ibisPinStates ?? {},
  )) {
    const port = resolveExternalSimulationPort({
      declaration: simulation,
      selector,
    })
    const bindings = models.filter((model) =>
      Object.values(model.ibis_pin_name_to_source_port_id).includes(
        port.source_port_id!,
      ),
    )
    if (bindings.length !== 1) {
      throw new Error(
        `Simulation "${simulation._parsedProps.name ?? "transient"}" pin "${selector}" requires exactly one IBIS model binding in this subcircuit.`,
      )
    }
  }
}
