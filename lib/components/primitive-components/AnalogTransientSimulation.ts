import { analogTransientSimulationProps } from "@tscircuit/props"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"
import type { AnalogDigitalStimulus } from "./AnalogDigitalStimulus"
import type { AnalogEyeDiagram } from "./AnalogEyeDiagram"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import { AnalogTransientSimulation_validateIbisBindings } from "./AnalogTransientSimulation_validateIbisBindings"
import { AnalogTransientSimulation_getPcbSpiceChannel } from "./AnalogTransientSimulation_getPcbSpiceChannel"

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
    if (this.getInheritedProperty("analogSimulationDisabled")) return

    AnalogTransientSimulation_validateIbisBindings(this)
  }

  updateSimulationSpiceEngineRender(): void {
    this.doInitialSimulationSpiceEngineRender()
  }

  onPropsChange(): void {
    this._markDirty("SimulationRender")
    if (!this.simulation_experiment_id) return
    const subcircuit = this.getSubcircuit()
    for (const declaration of [
      ...subcircuit.selectAll<AnalogDigitalStimulus>("analogdigitalstimulus"),
      ...subcircuit.selectAll<AnalogEyeDiagram>("analogeyediagram"),
    ]) {
      if (declaration.getSubcircuit() === subcircuit)
        declaration._markDirty("SimulationSpiceEngineRender")
    }
  }

  updateSimulationRender(): void {
    this.insertSimulationExperiment()
  }

  private removeIbisPinStates(): void {
    for (const state of this.root!.db.simulation_ibis_pin_state.list({
      simulation_experiment_id: this.simulation_experiment_id,
    })) {
      this.root!.db.simulation_ibis_pin_state.delete(
        state.simulation_ibis_pin_state_id,
      )
    }
  }

  removeSimulationRender(): void {
    if (!this.simulation_experiment_id) return
    this.removeIbisPinStates()
    this.root!.db.simulation_experiment.delete(this.simulation_experiment_id)
    this.simulation_experiment_id = null
  }

  protected insertSimulationExperiment() {
    const { db } = this.root!
    const { duration, name, startTime, timePerStep, spiceOptions } =
      this._parsedProps

    const ibisPinStates = this.getInheritedProperty("analogSimulationDisabled")
      ? {}
      : this._parsedProps.ibisPinStates
    const pins = Object.entries(ibisPinStates ?? {}).map(
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
    const experimentProps = {
      name: name ?? "spice_transient_analysis",
      experiment_type: "spice_transient_analysis" as const,
      end_time_ms: duration,
      start_time_ms: startTime,
      time_per_step: timePerStep,
      spice_options: spiceOptions,
      spice_engine: this.getSpiceEngineName(),
      pcb_spice_channel: AnalogTransientSimulation_getPcbSpiceChannel(this),
      subcircuit_id: this.getSubcircuit().subcircuit_id!,
    }
    const experiment = this.simulation_experiment_id
      ? db.simulation_experiment.update(
          this.simulation_experiment_id,
          experimentProps,
        )
      : db.simulation_experiment.insert(experimentProps)
    if (this.simulation_experiment_id) this.removeIbisPinStates()
    for (const pin of pins) {
      db.simulation_ibis_pin_state.insert({
        simulation_experiment_id: experiment.simulation_experiment_id,
        ...pin,
      })
    }
    return experiment
  }
}
