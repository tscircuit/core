import { analogAcSweepSimulationProps } from "@tscircuit/props"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"

export class AnalogAcSweepSimulation extends AnalogAnalysisSimulation<
  typeof analogAcSweepSimulationProps
> {
  get config() {
    return {
      componentName: "AnalogAcSweepSimulation",
      zodProps: analogAcSweepSimulationProps,
    }
  }

  protected insertSimulationExperiment() {
    const {
      name,
      spiceOptions,
      sweepType,
      samplesPerInterval,
      sampleCount,
      startFrequency,
      stopFrequency,
    } = this._parsedProps
    return this.root!.db.simulation_experiment.insert({
      name: name ?? "spice_ac_analysis",
      experiment_type: "spice_ac_analysis",
      spice_options: spiceOptions,
      ac_sweep_type: sweepType,
      ac_samples_per_interval: samplesPerInterval,
      ac_sample_count: sampleCount,
      ac_start_frequency_hz: startFrequency,
      ac_stop_frequency_hz: stopFrequency,
    })
  }
}
