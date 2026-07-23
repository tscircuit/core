import { analogDcSweepSimulationProps } from "@tscircuit/props"
import type {
  SimulationCurrentSource,
  SimulationVoltageSource,
} from "circuit-json"
import { CurrentSource } from "../normal-components/CurrentSource"
import { VoltageSource } from "../normal-components/VoltageSource"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"

type SimulationDcSweepSourceId =
  | SimulationVoltageSource["simulation_voltage_source_id"]
  | SimulationCurrentSource["simulation_current_source_id"]

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
    let sweepSourceId: SimulationDcSweepSourceId | null
    let sweepSourceType: "voltage" | "current"
    if (sweepSourceComponent instanceof VoltageSource) {
      sweepSourceComponent.runRenderPhase("SimulationRender")
      sweepSourceId = sweepSourceComponent.simulation_voltage_source_id
      sweepSourceType = "voltage"
    } else if (sweepSourceComponent instanceof CurrentSource) {
      sweepSourceComponent.runRenderPhase("SimulationRender")
      sweepSourceId = sweepSourceComponent.simulation_current_source_id
      sweepSourceType = "current"
    } else {
      this.renderError(
        `DC sweep source "${sweepSource}" must resolve to one voltage or current source.`,
      )
      return null
    }

    if (!sweepSourceId) {
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
