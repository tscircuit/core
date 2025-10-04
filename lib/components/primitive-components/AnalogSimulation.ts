import { analogSimulationProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class AnalogSimulation extends PrimitiveComponent<
  typeof analogSimulationProps
> {
  get config() {
    return {
      componentName: "AnalogSimulation",
      zodProps: analogSimulationProps,
    }
  }

  doInitialSourceRender(): void {
    // AnalogSimulation is a configuration component that doesn't
    // render circuit elements but configures simulation parameters
  }
}
