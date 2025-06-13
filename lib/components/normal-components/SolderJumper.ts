import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { solderjumperProps } from "@tscircuit/props"
import { Port } from "../primitive-components/Port"
import type { BaseSymbolName } from "lib/utils/constants"
import {
  getAllDimensionsForSchematicBox,
  type SchematicBoxDimensions,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"

export class SolderJumper<
  PinLabels extends string = never,
> extends NormalComponent<typeof solderjumperProps, PinLabels> {
  schematicDimensions: SchematicBoxDimensions | null = null

  get defaultInternallyConnectedPinNames(): string[][] {
    return (
      this._parsedProps.bridgedPins ??
      this._parsedProps.internallyConnectedPins ??
      []
    )
  }

  get config() {
    let symbolName = ""
    const bridged =
      this.props.bridgedPins ?? this.props.internallyConnectedPins
    const pinCount =
      this.props.pinCount ??
      (Array.isArray(bridged) && bridged.flat().length > 2 ? 3 : 2)

    symbolName += `solderjumper${pinCount}`

    if (Array.isArray(bridged) && bridged.length > 0) {
      const pins = Array.from(new Set(bridged.flat()))
        .sort()
        .join("")
      symbolName += `_bridged${pins}`
    }
    return {
      schematicSymbolName: symbolName,
      componentName: "SolderJumper",
      zodProps: solderjumperProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  _getSchematicPortArrangement() {
    const arrangement = super._getSchematicPortArrangement()
    if (arrangement) return arrangement

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
