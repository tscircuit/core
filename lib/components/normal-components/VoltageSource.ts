import { voltageSourceProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { type BaseSymbolName, type Ftype } from "lib/utils/constants"
import type { SimulationAcVoltageSource } from "circuit-json"

import type { RenderPhase } from "lib/components/base-components/Renderable"

export type WaveShape = "sinewave" | "square" | "triangle" | "sawtooth"

export class VoltageSource extends NormalComponent<
  typeof voltageSourceProps,
  "terminal1" | "terminal2"
> {
  get config() {
    const isSquare = this.props.waveShape === "square"
    return {
      componentName: "VoltageSource",
      schematicSymbolName: (isSquare
        ? "square_wave"
        : "ac_voltmeter") as BaseSymbolName,
      zodProps: voltageSourceProps,
      sourceFtype: "simple_voltage_source" as Ftype,
    }
  }

  runRenderPhaseForChildren(phase: RenderPhase): void {
    if (phase.startsWith("Pcb")) {
      return
    }
    for (const child of this.children) {
      child.runRenderPhaseForChildren(phase)
      child.runRenderPhase(phase)
    }
  }

  doInitialPcbComponentRender() {}

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["terminal1"],
        pin2: ["terminal2"],
      },
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_voltage_source",
      name: this.name,
      voltage: props.voltage,
      frequency: props.frequency,
      peak_to_peak_voltage: props.peakToPeakVoltage,
      wave_shape: props.waveShape,
      phase: props.phase,
      duty_cycle: props.dutyCycle,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
    } as any)
    this.source_component_id = source_component.source_component_id
  }

  doInitialSimulationRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const terminal1Port = this.portMap.terminal1!
    const terminal2Port = this.portMap.terminal2!
    ;(db as any).simulation_voltage_source.insert({
      type: "simulation_voltage_source",
      is_dc_source: false,
      terminal1_source_port_id: terminal1Port.source_port_id,
      terminal2_source_port_id: terminal2Port.source_port_id,
      voltage: props.voltage,
      frequency: props.frequency,
      peak_to_peak_voltage: props.peakToPeakVoltage,
      wave_shape: props.waveShape,
      phase: props.phase,
      duty_cycle: props.dutyCycle,
    } as SimulationAcVoltageSource)
  }

  terminal1 = this.portMap.terminal1
  terminal2 = this.portMap.terminal2
}
