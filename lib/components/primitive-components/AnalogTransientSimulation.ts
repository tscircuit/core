import { analogTransientSimulationProps } from "@tscircuit/props"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import { AnalogTransientSimulation_validateIbisBindings } from "./AnalogTransientSimulation_validateIbisBindings"

export class AnalogTransientSimulation extends AnalogAnalysisSimulation<
  typeof analogTransientSimulationProps
> {
  get config() {
    return {
      componentName: "AnalogTransientSimulation",
      zodProps: analogTransientSimulationProps,
    }
  }

  doInitialSimulationSpiceEngineRender(): void {
    AnalogTransientSimulation_validateIbisBindings(this)
  }

  protected insertSimulationExperiment() {
    const { db } = this.root!
    const { duration, name, startTime, timePerStep, spiceOptions } =
      this._parsedProps

    const pins = Object.entries(this._parsedProps.ibisPinStates ?? {}).map(
      ([selector, state]) => {
        const pin = {
          source_port_id: resolveExternalSimulationPort({
            declaration: this,
            selector,
          }).source_port_id!,
          is_output: state.isOutput,
        }
        if (state.isOutput)
          return { ...pin, is_output_enabled: state.isOutputEnabled }
        return pin
      },
    )
    if (new Set(pins.map((pin) => pin.source_port_id)).size !== pins.length) {
      throw new Error(
        `Simulation "${name ?? "transient"}" assigns multiple states to the same physical pin.`,
      )
    }
    const experiment = db.simulation_experiment.insert({
      name: name ?? "spice_transient_analysis",
      experiment_type: "spice_transient_analysis",
      end_time_ms: duration,
      start_time_ms: startTime,
      time_per_step: timePerStep,
      spice_options: spiceOptions,
      spice_engine: this.getSpiceEngineName(),
      subcircuit_id: this.getSubcircuit().subcircuit_id!,
    })
    for (const pin of pins) {
      db.simulation_ibis_pin_state.insert({
        simulation_experiment_id: experiment.simulation_experiment_id,
        ...pin,
      })
    }
    return experiment
  }
}
