import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { jumperProps } from "@tscircuit/props"
import { Port } from "../primitive-components/Port"
import type { BaseSymbolName } from "lib/utils/constants"
import {
  getAllDimensionsForSchematicBox,
  type SchematicBoxDimensions,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"

export class Jumper<PinLabels extends string = never> extends NormalComponent<
  typeof jumperProps,
  PinLabels
> {
  schematicDimensions: SchematicBoxDimensions | null = null

  get config() {
    let symbolName = ""
    if (this.props.pinCount)
      symbolName += `solderjumper${this.props.pinCount || 2}`
    if (
      Array.isArray(this.props.internallyConnectedPins) &&
      this.props.internallyConnectedPins.length > 0
    ) {
      const pins = Array.from(
        new Set(this.props.internallyConnectedPins.flat()),
      )
        .sort()
        .join("")
      symbolName += `_bridged${pins}`
    }
    return {
      schematicSymbolName: symbolName,
      componentName: "Jumper",
      zodProps: jumperProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_chip", // TODO unknown or jumper
      name: props.name,
      manufacturer_part_number: props.manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
    })
    this.source_component_id = source_component.source_component_id!
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const pcb_component = db.pcb_component.insert({
      center: { x: props.pcbX ?? 0, y: props.pcbY ?? 0 },
      width: 2, // Default width, adjust as needed
      height: 3, // Default height, adjust as needed
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.pcb_component_id = pcb_component.pcb_component_id
  }

  doInitialPcbTraceRender() {
    const { db } = this.root!
    const pcb_ports = db.pcb_port.list({
      pcb_component_id: this.pcb_component_id,
    })
    const pinLabelToPortId: Record<string, string> = {}
    // Map pin labels ("1", "2", etc.) to pcb_port_id
    for (const port of pcb_ports) {
      const match = port.source_port_id && port.source_port_id.match(/(\d+)$/)
      if (match) {
        const label = (parseInt(match[1], 10) + 1).toString()
        pinLabelToPortId[label] = port.pcb_port_id
      }
    }
    const traces = db.pcb_trace.list()
    for (const trace of traces) {
      if (trace.route) {
        for (const segment of trace.route) {
          if (segment.route_type === "wire") {
            if (
              segment.start_pcb_port_id &&
              typeof segment.start_pcb_port_id === "string" &&
              segment.start_pcb_port_id.startsWith("{PIN")
            ) {
              const pin = segment.start_pcb_port_id
                .replace("{PIN", "")
                .replace("}", "")
              if (pinLabelToPortId[pin]) {
                segment.start_pcb_port_id = pinLabelToPortId[pin]
              }
            }
            if (
              segment.end_pcb_port_id &&
              typeof segment.end_pcb_port_id === "string" &&
              segment.end_pcb_port_id.startsWith("{PIN")
            ) {
              const pin = segment.end_pcb_port_id
                .replace("{PIN", "")
                .replace("}", "")
              if (pinLabelToPortId[pin]) {
                segment.end_pcb_port_id = pinLabelToPortId[pin]
              }
            }
          }
        }
      }
    }
  }
}
