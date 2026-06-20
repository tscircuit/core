import { ammeterProps } from "@tscircuit/props"
import type {
  SimulationCurrentProbeInput,
  SourceSimpleAmmeterInput,
} from "circuit-json"
import type { RenderPhase } from "lib/components/base-components/Renderable"
import { type BaseSymbolName, type Ftype } from "lib/utils/constants"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

export class Ammeter extends NormalComponent<
  typeof ammeterProps,
  "pos" | "neg"
> {
  get config() {
    return {
      componentName: "Ammeter",
      schematicSymbolName: "dc_ammeter" as BaseSymbolName,
      zodProps: ammeterProps,
      sourceFtype: "simple_ammeter" as Ftype,
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

  doInitialPcbComponentRender() {
    const hasExplicitPcbPosition = this._hasUserDefinedPcbPosition()
    if (!this._parsedProps.footprint) {
      if (!hasExplicitPcbPosition) return
      throw new Error(
        "Ammeter requires a footprint when pcbX/pcbY or pcb edge position props are used",
      )
    }
    super.doInitialPcbComponentRender()
  }

  initPorts() {
    super.initPorts({
      ignoreSymbolPorts: true,
      pinCount: 2,
      additionalAliases: {
        pin1: ["pos"],
        pin2: ["neg"],
      },
    })

    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!
    this.portMap.pos.schematicSymbolPortDef =
      symbol.ports.find((port) => port.labels.includes("1")) ?? null
    this.portMap.neg.schematicSymbolPortDef =
      symbol.ports.find((port) => port.labels.includes("2")) ?? null
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_ammeter",
      name: this.name,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
    } as SourceSimpleAmmeterInput)
    this.source_component_id = source_component.source_component_id
  }

  doInitialSimulationRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const posPort = this.portMap.pos
    const negPort = this.portMap.neg
    const displayOptions = props.display

    db.simulation_current_probe.insert({
      type: "simulation_current_probe",
      name: this.name,
      source_component_id: this.source_component_id!,
      positive_source_port_id: posPort.source_port_id!,
      negative_source_port_id: negPort.source_port_id!,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
      color: props.color,
      display_options: displayOptions
        ? {
            label: displayOptions.label,
            center: displayOptions.center,
            offset_divs: displayOptions.offsetDivs,
            units_per_div: displayOptions.unitsPerDiv,
          }
        : undefined,
    } as SimulationCurrentProbeInput)
  }

  pos = this.portMap.pos
  neg = this.portMap.neg
}
