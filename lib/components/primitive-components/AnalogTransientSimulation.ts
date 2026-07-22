import { analogTransientSimulationProps } from "@tscircuit/props"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"

export class AnalogTransientSimulation extends AnalogAnalysisSimulation<
  typeof analogTransientSimulationProps
> {
  get config() {
    return {
      componentName: "AnalogTransientSimulation",
      zodProps: analogTransientSimulationProps,
    }
  }

  protected insertSimulationExperiment() {
    const { db } = this.root!
    const { duration, name, startTime, timePerStep, spiceOptions } =
      this._parsedProps

    return db.simulation_experiment.insert({
      name: name ?? "spice_transient_analysis",
      experiment_type: "spice_transient_analysis",
      end_time_ms: duration,
      start_time_ms: startTime,
      time_per_step: timePerStep,
      spice_options: spiceOptions,
    })
  }
}
