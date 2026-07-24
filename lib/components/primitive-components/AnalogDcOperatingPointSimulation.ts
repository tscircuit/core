import { analogDcOperatingPointSimulationProps } from "@tscircuit/props"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"

export class AnalogDcOperatingPointSimulation extends AnalogAnalysisSimulation<
  typeof analogDcOperatingPointSimulationProps
> {
  get config() {
    return {
      componentName: "AnalogDcOperatingPointSimulation",
      zodProps: analogDcOperatingPointSimulationProps,
    }
  }

  protected insertSimulationExperiment() {
    const { name, spiceOptions } = this._parsedProps
    return this.root!.db.simulation_experiment.insert({
      name: name ?? "spice_dc_operating_point",
      experiment_type: "spice_dc_operating_point",
      spice_options: spiceOptions,
    })
  }
}
