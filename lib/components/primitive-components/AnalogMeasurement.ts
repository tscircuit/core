import { analogMeasurementProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { AnalogTransientSimulation } from "./AnalogTransientSimulation"

export class AnalogMeasurement extends PrimitiveComponent<
  typeof analogMeasurementProps
> {
  get config() {
    return {
      componentName: "AnalogMeasurement",
      zodProps: analogMeasurementProps,
    }
  }

  doInitialSimulationRender(): void {
    if (!(this.parent instanceof AnalogTransientSimulation)) {
      this.renderError(
        "analog.measurement must be nested directly in analog.transientsimulation.",
      )
    }
  }
}
