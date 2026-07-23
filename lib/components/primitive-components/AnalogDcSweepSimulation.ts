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
    let dcSweepSourceFields:
      | {
          dc_sweep_voltage_source_id: string
          dc_sweep_unit: "V"
        }
      | {
          dc_sweep_current_source_id: string
          dc_sweep_unit: "A"
        }

    if (sweepSourceComponent instanceof VoltageSource) {
      sweepSourceComponent.runRenderPhase("SimulationRender")
      const simulationVoltageSourceId =
        sweepSourceComponent.simulation_voltage_source_id
      if (!simulationVoltageSourceId) {
        this.renderError(
          `DC sweep source "${sweepSource}" must resolve to one voltage or current source.`,
        )
        return null
      }
      dcSweepSourceFields = {
        dc_sweep_voltage_source_id: simulationVoltageSourceId,
        dc_sweep_unit: "V",
      }
    } else if (sweepSourceComponent instanceof CurrentSource) {
      sweepSourceComponent.runRenderPhase("SimulationRender")
      const simulationCurrentSourceId =
        sweepSourceComponent.simulation_current_source_id
      if (!simulationCurrentSourceId) {
        this.renderError(
          `DC sweep source "${sweepSource}" must resolve to one voltage or current source.`,
        )
        return null
      }
      dcSweepSourceFields = {
        dc_sweep_current_source_id: simulationCurrentSourceId,
        dc_sweep_unit: "A",
      }
    } else {
      this.renderError(
        `DC sweep source "${sweepSource}" must resolve to one voltage or current source.`,
      )
      return null
    }

    return this.root!.db.simulation_experiment.insert({
      name: name ?? "spice_dc_sweep",
      experiment_type: "spice_dc_sweep",
      spice_options: spiceOptions,
      ...dcSweepSourceFields,
      dc_sweep_start: sweepStart,
      dc_sweep_stop: sweepStop,
      dc_sweep_step: sweepStep,
    })
  }
}
