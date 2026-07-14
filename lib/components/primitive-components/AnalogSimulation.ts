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

  doInitialSimulationRender(): void {
    const { db } = this.root!
    const {
      duration,
      name,
      simulationType,
      startTime,
      timePerStep,
      timeout,
      spiceOptions,
    } = this._parsedProps

    const isTransient = simulationType === "spice_transient_analysis"
    const durationMs = isTransient ? duration || 10 : undefined
    const timePerStepMs = isTransient ? timePerStep || 0.01 : undefined

    const simulationExperiment = db.simulation_experiment.insert({
      name: name ?? simulationType,
      experiment_type: simulationType,
      end_time_ms: durationMs,
      start_time_ms: isTransient ? startTime : undefined,
      time_per_step: timePerStepMs,
      timeout_ms: timeout,
      spice_options: spiceOptions,
    })

    this.simulation_experiment_id =
      simulationExperiment.simulation_experiment_id
  }
}
