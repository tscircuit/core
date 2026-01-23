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
    // Jumpers always render as generic schematic boxes instead of using
    // solderjumper-specific symbols.
    return {
      schematicSymbolName: undefined,
      componentName: "Jumper",
      zodProps: jumperProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  _getSchematicPortArrangement() {
    const arrangement = super._getSchematicPortArrangement()
    if (arrangement && Object.keys(arrangement).length > 0) return arrangement

    const pinCount =
      this._parsedProps.pinCount ??
      (Array.isArray(this._parsedProps.pinLabels)
        ? this._parsedProps.pinLabels.length
        : this._parsedProps.pinLabels
          ? Object.keys(this._parsedProps.pinLabels).length
          : this.getPortsFromFootprint().length)

    const direction = this._parsedProps.schDirection ?? "right"

    return {
      leftSize: direction === "left" ? pinCount : 0,
      rightSize: direction === "right" ? pinCount : 0,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { pcbX, pcbY } = this.getResolvedPcbPositionProp()

    const source_component = db.source_component.insert({
      ftype: "simple_chip", // TODO unknown or jumper
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
      display_name: props.displayName,
    })
    this.source_component_id = source_component.source_component_id!
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { pcbX, pcbY } = this.getResolvedPcbPositionProp()

    const pcb_component = db.pcb_component.insert({
      center: { x: pcbX, y: pcbY },
      width: 2, // Default width, adjust as needed
      height: 3, // Default height, adjust as needed
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      do_not_place: props.doNotPlace ?? false,
      obstructs_within_bounds: props.obstructsWithinBounds ?? true,
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
    for (let i = 0; i < pcb_ports.length; i++) {
      const port = pcb_ports[i]
      const sourcePort = db.source_port.get(port.source_port_id)
      let pinLabel = ""
      if (typeof sourcePort?.pin_number === "number") {
        pinLabel = sourcePort.pin_number.toString()
      } else if (Array.isArray(sourcePort?.port_hints)) {
        let matchedHint = sourcePort.port_hints.find((h: string) =>
          /^(pin)?\d+$/.test(h),
        )
        if (matchedHint) {
          if (/^pin\d+$/.test(matchedHint)) {
            pinLabel = matchedHint.replace(/^pin/, "")
          } else {
            pinLabel = matchedHint
          }
        }
      }
      pinLabelToPortId[pinLabel] = port.pcb_port_id
    }
    const traces = db.pcb_trace.list({
      pcb_component_id: this.pcb_component_id,
    })
    const updatePortId = (portId: string | undefined) => {
      if (portId && typeof portId === "string" && portId.startsWith("{PIN")) {
        const pin = portId.replace("{PIN", "").replace("}", "")
        return pinLabelToPortId[pin] || portId
      }
      return portId
    }
    for (const trace of traces) {
      if (!trace.route) continue
      for (const segment of trace.route) {
        if (segment.route_type !== "wire") continue
        segment.start_pcb_port_id = updatePortId(segment.start_pcb_port_id)
        segment.end_pcb_port_id = updatePortId(segment.end_pcb_port_id)
      }
    }
  }
}
