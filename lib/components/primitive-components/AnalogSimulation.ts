import {
  analogSimulationProps,
  analogSimulationProps as baseAnalogSimulationProps,
} from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"

export class AnalogSimulation extends PrimitiveComponent<
  typeof analogSimulationProps
> {
  get config() {
    return {
      componentName: "AnalogSimulation",
      zodProps: analogSimulationProps,
    }
  }

  doInitialSimulationRender(): void {
    const { db } = this.root!
    const { duration, timePerStep } = this._parsedProps

    const durationMs = duration || 10 // ms
    const timePerStepMs = timePerStep || 0.01 // ms

    db.simulation_experiment.insert({
      name: `spice_transient_analysis_${this._renderId}`,
      experiment_type: "spice_transient_analysis" as const,
      end_time_ms: durationMs,
      time_per_step: timePerStepMs,
    })
  }
}
