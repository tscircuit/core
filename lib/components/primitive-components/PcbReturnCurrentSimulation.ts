import { pcbReturnCurrentSimulationProps } from "@tscircuit/props"
import type { SimulationExperiment } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

type SimulationExperimentId = SimulationExperiment["simulation_experiment_id"]

/** Declares a pending experiment; running an EM solver is a separate operation. */
export class PcbReturnCurrentSimulation extends PrimitiveComponent<
  typeof pcbReturnCurrentSimulationProps
> {
  simulation_experiment_id: SimulationExperimentId | null = null

  get config() {
    return {
      componentName: "PcbReturnCurrentSimulation",
      zodProps: pcbReturnCurrentSimulationProps,
    }
  }

  doInitialSimulationRender(): void {
    if (this.root?.pcbDisabled) return
    if (this.parent?.componentName === "PcbReturnCurrentSimulation") {
      this.renderError(
        "A PCB return-current simulation cannot contain another simulation.",
      )
    }
    if (
      this.children.some(
        (child) => child.componentName !== "PcbReturnCurrentExcitation",
      )
    ) {
      this.renderError(
        "A PCB return-current simulation can contain only return-current excitations.",
      )
    }

    const experiment = this.root!.db.simulation_experiment.insert({
      name: this._parsedProps.name ?? "PCB return current",
      experiment_type: "pcb_return_current",
    })
    this.simulation_experiment_id = experiment.simulation_experiment_id
  }

  updateSimulationRender(): void {
    if (!this.simulation_experiment_id) return
    this.root!.db.simulation_experiment.update(this.simulation_experiment_id, {
      name: this._parsedProps.name ?? "PCB return current",
    })
  }

  removeSimulationRender(): void {
    if (!this.simulation_experiment_id) return
    this.root!.db.simulation_experiment.delete(this.simulation_experiment_id)
    this.simulation_experiment_id = null
  }
}
