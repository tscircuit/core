import { pcbNoiseSimulationProps } from "@tscircuit/props"
import type {
  SimulationExperiment,
  SimulationPcbNoiseConfiguration,
} from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { PcbNoiseSimulation_doInitialPcbSimulationRender } from "./PcbNoiseSimulation_doInitialPcbSimulationRender"

type SimulationExperimentId = SimulationExperiment["simulation_experiment_id"]
type SimulationPcbNoiseConfigurationId =
  SimulationPcbNoiseConfiguration["simulation_pcb_noise_configuration_id"]

/** Declares physical noise inputs; network solving is a separate operation. */
export class PcbNoiseSimulation extends PrimitiveComponent<
  typeof pcbNoiseSimulationProps
> {
  simulation_experiment_id: SimulationExperimentId | null = null
  simulation_pcb_noise_configuration_id: SimulationPcbNoiseConfigurationId | null =
    null

  get config() {
    return {
      componentName: "PcbNoiseSimulation",
      zodProps: pcbNoiseSimulationProps,
    }
  }

  doInitialSimulationRender(): void {
    if (this.root?.pcbDisabled) return
    if (this.parent?.componentName === "PcbNoiseSimulation") {
      this.renderError(
        "A PCB noise simulation cannot contain another simulation.",
      )
    }
    const experiment = this.root!.db.simulation_experiment.insert({
      name: this._parsedProps.name ?? "PCB noise",
      experiment_type: "pcb_noise",
    })
    this.simulation_experiment_id = experiment.simulation_experiment_id
  }

  updateSimulationRender(): void {
    if (!this.simulation_experiment_id) return
    this.root!.db.simulation_experiment.update(this.simulation_experiment_id, {
      name: this._parsedProps.name ?? "PCB noise",
    })
  }

  doInitialPcbSimulationRender(): void {
    PcbNoiseSimulation_doInitialPcbSimulationRender(this)
  }

  updatePcbSimulationRender(): void {
    this.doInitialPcbSimulationRender()
  }

  removePcbSimulationRender(): void {
    if (!this.simulation_pcb_noise_configuration_id) return
    this.root!.db.simulation_pcb_noise_configuration.delete(
      this.simulation_pcb_noise_configuration_id,
    )
    this.simulation_pcb_noise_configuration_id = null
  }

  removeSimulationRender(): void {
    this.removePcbSimulationRender()
    if (!this.simulation_experiment_id) return
    this.root!.db.simulation_experiment.delete(this.simulation_experiment_id)
    this.simulation_experiment_id = null
  }

  onPropsChange(): void {
    this._markDirty("SimulationRender")
  }

  onChildChanged(child: PrimitiveComponent): void {
    this._markDirty("PcbSimulationRender")
    super.onChildChanged(child)
  }

  add(child: PrimitiveComponent): void {
    super.add(child)
    this._markDirty("PcbSimulationRender")
  }

  remove(child: PrimitiveComponent): void {
    super.remove(child)
    this._markDirty("PcbSimulationRender")
  }
}
