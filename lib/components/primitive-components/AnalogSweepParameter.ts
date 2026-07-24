import { analogSweepParameterProps } from "@tscircuit/props"
import type { SimulationParameterSweep } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { AnalogSweepParameter_doInitialSimulationRender } from "./AnalogSweepParameter_doInitialSimulationRender"

type SimulationParameterSweepId =
  SimulationParameterSweep["simulation_parameter_sweep_id"]

export class AnalogSweepParameter extends PrimitiveComponent<
  typeof analogSweepParameterProps
> {
  simulation_parameter_sweep_id: SimulationParameterSweepId | null = null

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
