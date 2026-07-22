import { analogDcSweepSimulationProps } from "@tscircuit/props"
import { CurrentSource } from "../normal-components/CurrentSource"
import { VoltageSource } from "../normal-components/VoltageSource"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"

export class AnalogDcSweepSimulation extends AnalogAnalysisSimulation<
  typeof analogDcSweepSimulationProps
> {
  get config() {
    return {
      componentName: "AnalogDcSweepSimulation",
      zodProps: analogDcSweepSimulationProps,
    }
  }

  protected insertSimulationExperiment() {
    const {
      name,
      spiceOptions,
      sweepSource,
      sweepStart,
      sweepStop,
      sweepStep,
    } = this._parsedProps
    const simulationScope = this.getGroup() ?? this.getSubcircuit()
    const sweepSourceComponent = simulationScope?.selectOne(sweepSource)
    if (
      sweepSourceComponent instanceof VoltageSource ||
      sweepSourceComponent instanceof CurrentSource
    ) {
      sweepSourceComponent.runRenderPhase("SimulationRender")
    }
    const sweepSourceId =
      sweepSourceComponent instanceof VoltageSource
        ? sweepSourceComponent.simulation_voltage_source_id
        : sweepSourceComponent instanceof CurrentSource
          ? sweepSourceComponent.simulation_current_source_id
          : null
    const sweepSourceType =
      sweepSourceComponent instanceof VoltageSource
        ? ("voltage" as const)
        : sweepSourceComponent instanceof CurrentSource
          ? ("current" as const)
          : null

    if (!sweepSourceId || !sweepSourceType) {
      this.renderError(
        `DC sweep source "${sweepSource}" must resolve to one voltage or current source.`,
      )
      return null
    }

    return this.root!.db.simulation_experiment.insert({
      name: name ?? "spice_dc_sweep",
      experiment_type: "spice_dc_sweep",
      spice_options: spiceOptions,
      dc_sweep_source_id: sweepSourceId,
      dc_sweep_source_type: sweepSourceType,
      dc_sweep_start: sweepStart,
      dc_sweep_stop: sweepStop,
      dc_sweep_step: sweepStep,
      dc_sweep_unit: sweepSourceType === "voltage" ? "V" : "A",
    })
  }
}
