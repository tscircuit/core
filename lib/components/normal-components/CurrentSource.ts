import { currentSourceProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { type BaseSymbolName, type Ftype } from "lib/utils/constants"
import type { SimulationCurrentSource } from "circuit-json"
import { formatSiUnit } from "format-si-unit"

import type { RenderPhase } from "lib/components/base-components/Renderable"
import { type WaveShape } from "./VoltageSource"

export class CurrentSource extends NormalComponent<
  typeof currentSourceProps,
  "pos" | "neg"
> {
  get config() {
    const symbolName = "current_source"

    return {
      componentName: "CurrentSource",
      schematicSymbolName: symbolName,
      zodProps: currentSourceProps,
      sourceFtype: "simple_current_source" as Ftype,
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
        pin1: ["pos"],
        pin2: ["neg"],
      },
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    const { current, frequency, peakToPeakCurrent } = this._parsedProps
    const parts: string[] = []

    if (current !== undefined) {
      parts.push(`${formatSiUnit(current)}A`)
    }
    if (peakToPeakCurrent !== undefined) {
      parts.push(`${formatSiUnit(peakToPeakCurrent)}A p-p`)
    }

    if (frequency !== undefined) {
      parts.push(`${formatSiUnit(frequency)}Hz`)
    }

    return parts.length > 0 ? parts.join(" ") : undefined
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_current_source",
      name: this.name,
      current: props.current,
      frequency: props.frequency,
      peak_to_peak_current: props.peakToPeakCurrent,
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

    const isAc =
      props.frequency !== undefined ||
      props.peakToPeakCurrent !== undefined ||
      props.waveShape !== undefined

    const posPort = this.portMap.pos!
    const negPort = this.portMap.neg!

    if (isAc) {
      db.simulation_current_source.insert({
        type: "simulation_current_source",
        is_dc_source: false,
        terminal1_source_port_id: posPort.source_port_id,
        terminal2_source_port_id: negPort.source_port_id,
        current: props.current, // DC offset
        frequency: props.frequency,
        peak_to_peak_current: props.peakToPeakCurrent,
        wave_shape: props.waveShape,
        phase: props.phase,
        duty_cycle: props.dutyCycle,
      } as SimulationCurrentSource)
    } else {
      if (props.current === undefined) return
      db.simulation_current_source.insert({
        type: "simulation_current_source",
        is_dc_source: true,
        positive_source_port_id: posPort.source_port_id,
        negative_source_port_id: negPort.source_port_id,
        current: props.current,
      } as SimulationCurrentSource)
    }
  }

  pos = this.portMap.pos
  neg = this.portMap.neg
}
