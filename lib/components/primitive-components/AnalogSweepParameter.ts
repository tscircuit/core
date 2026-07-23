import { analogSweepParameterProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { AnalogSweepParameter_doInitialSimulationRender } from "./AnalogSweepParameter_doInitialSimulationRender"

export class AnalogSweepParameter extends PrimitiveComponent<
  typeof analogSweepParameterProps
> {
  simulation_parameter_sweep_id: string | null = null

  get config() {
    return {
      componentName: "AnalogSweepParameter",
      zodProps: analogSweepParameterProps,
    }
  }

  doInitialSimulationRender(): void {
    AnalogSweepParameter_doInitialSimulationRender(this)
  }
}
