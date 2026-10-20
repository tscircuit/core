import { analogDigitalStimulusProps } from "@tscircuit/props"
import type { SimulationDigitalStimulus } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { AnalogDigitalStimulus_getSimulationDigitalStimulus } from "./AnalogDigitalStimulus_getSimulationDigitalStimulus"

type SimulationDigitalStimulusId =
  SimulationDigitalStimulus["simulation_digital_stimulus_id"]

export class AnalogDigitalStimulus extends PrimitiveComponent<
  typeof analogDigitalStimulusProps
> {
  simulation_digital_stimulus_id: SimulationDigitalStimulusId | null = null
  get config() {
    return {
      componentName: "AnalogDigitalStimulus",
      zodProps: analogDigitalStimulusProps,
    }
  }

  doInitialSimulationRender(): void {
    if (this.getInheritedProperty("analogSimulationDisabled")) return

    const stimulus = AnalogDigitalStimulus_getSimulationDigitalStimulus(this)
    if (this.simulation_digital_stimulus_id)
      this.root!.db.simulation_digital_stimulus.update(
        this.simulation_digital_stimulus_id,
        stimulus,
      )
    else
      this.simulation_digital_stimulus_id =
        this.root!.db.simulation_digital_stimulus.insert(
          stimulus,
        ).simulation_digital_stimulus_id
  }

  onPropsChange(): void {
    this._markDirty("SimulationSpiceEngineRender")
  }

  // Refresh traffic after every experiment has updated its pin states.
  updateSimulationSpiceEngineRender(): void {
    this.doInitialSimulationRender()
  }
  removeSimulationRender(): void {
    if (this.simulation_digital_stimulus_id)
      this.root!.db.simulation_digital_stimulus.delete(
        this.simulation_digital_stimulus_id,
      )
    this.simulation_digital_stimulus_id = null
  }
}
