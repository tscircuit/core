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

  onPropsChange(): void {
    this._markDirty("SimulationRender")
  }

  updateSimulationRender(): void {
    this.insertSimulationExperiment()
  }

  removeSimulationRender(): void {
    if (!this.simulation_experiment_id) return
    this.root!.db.simulation_experiment.delete(this.simulation_experiment_id)
    this.simulation_experiment_id = null
  }

  protected insertSimulationExperiment() {
    const { db } = this.root!
    const { duration, name, startTime, timePerStep, spiceOptions } =
      this._parsedProps

    const experimentProps = {
      name: name ?? "spice_transient_analysis",
      experiment_type: "spice_transient_analysis" as const,
      end_time_ms: duration,
      start_time_ms: startTime,
      time_per_step: timePerStep,
      spice_options: spiceOptions,
      spice_engine: this.getSpiceEngineName(),
      subcircuit_id: this.getSubcircuit().subcircuit_id!,
    }
    const experiment = this.simulation_experiment_id
      ? db.simulation_experiment.update(
          this.simulation_experiment_id,
          experimentProps,
        )
      : db.simulation_experiment.insert(experimentProps)
    return experiment
  }
}
