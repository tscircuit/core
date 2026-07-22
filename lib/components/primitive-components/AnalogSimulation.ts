import { analogSimulationProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class AnalogSimulation extends PrimitiveComponent<
  typeof analogSimulationProps
> {
  simulation_experiment_id: string | null = null

  get config() {
    return {
      componentName: "AnalogSimulation",
      zodProps: analogSimulationProps,
    }
  }

  getSpiceEngineName(): string | undefined {
    return this._parsedProps.spiceEngine
  }

  usesIndependentGraphAxes(): boolean {
    return this._parsedProps.graphIndependentAxes === true
  }

  doInitialSimulationRender(): void {
    const { db } = this.root!
    const { duration, name, startTime, timePerStep, spiceOptions } =
      this._parsedProps

    const durationMs = duration || 10 // ms
    const timePerStepMs = timePerStep || 0.01 // ms

    const simulationExperiment = db.simulation_experiment.insert({
      name: name ?? "spice_transient_analysis",
      experiment_type: "spice_transient_analysis" as const,
      end_time_ms: durationMs,
      start_time_ms: startTime,
      time_per_step: timePerStepMs,
      spice_options: spiceOptions,
    })

    this.simulation_experiment_id =
      simulationExperiment.simulation_experiment_id
  }
}
