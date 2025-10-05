import { analogSimulationProps as baseAnalogSimulationProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"

const analogSimulationProps = baseAnalogSimulationProps.extend({
  duration: z.union([z.string(), z.number()]).optional(),
  timePerStep: z.union([z.string(), z.number()]).optional(),
})

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
