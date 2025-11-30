import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { solderjumperProps } from "@tscircuit/props"
import { Port } from "../primitive-components/Port"
import type { SchematicBoxDimensions } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

export class SolderJumper<
  PinLabels extends string = never,
> extends NormalComponent<typeof solderjumperProps, PinLabels> {
  schematicDimensions: SchematicBoxDimensions | null = null

  _getPinNumberFromBridgedPinName(pinName: string): number | null {
    const port = this.selectOne(`port.${pinName}`, {
      type: "port",
    }) as Port | null
    return port?._parsedProps.pinNumber ?? null
  }

  get defaultInternallyConnectedPinNames(): string[][] {
    if (this._parsedProps.bridged) {
      const pins = this.children
        .filter((c) => c.componentName === "Port")
        .map((p) => (p as Port).name)
      return pins.length > 0 ? [pins] : []
    }
    return this._parsedProps.bridgedPins ?? []
  }

  get config() {
    const props = this._parsedProps ?? this.props
    let resolvedPinCount = props.pinCount
    if (props.pinCount == null && !props.footprint) {
      // If neither pinCount nor a footprint is given, assume two pins
      resolvedPinCount = 2
    }
    if (props.pinCount == null) {
      const nums = (props.bridgedPins ?? [])
        .flat()
        .map((p_str: string) => this._getPinNumberFromBridgedPinName(p_str))
        .filter((n): n is number => n !== null)
      const maxPinFromBridged = nums.length > 0 ? Math.max(...nums) : 0

      const pinCountFromLabels = props.pinLabels
        ? Object.keys(props.pinLabels).length
        : 0

      const finalPinCount = Math.max(maxPinFromBridged, pinCountFromLabels)

      // This logic is related to available solderjumper2, solderjumper3 symbols
      if (finalPinCount === 2 || finalPinCount === 3) {
        resolvedPinCount = finalPinCount as 2 | 3
      }

      // Fallback: infer from footprint pin count
      if (
        resolvedPinCount == null &&
        props.footprint &&
        [2, 3].includes(this.getPortsFromFootprint().length)
      ) {
        resolvedPinCount = this.getPortsFromFootprint().length as 2 | 3
      }
    }

    let symbolName = ""
    if (resolvedPinCount) {
      symbolName += `solderjumper${resolvedPinCount}`
    } else {
      // Fallback if pinCount couldn't be resolved (e.g. from non-numeric bridgedPins)
      // This might lead to a generic box if "solderjumper" itself isn't a symbol.
      symbolName = "solderjumper"
    }

    let bridgedPinNumbers: number[] = []
    if (Array.isArray(props.bridgedPins) && props.bridgedPins.length > 0) {
      // Normalize pin names (e.g., "pin1" to "1"), then get unique sorted numbers
      bridgedPinNumbers = Array.from(
        new Set(
          (props.bridgedPins as string[][])
            .flat()
            .map((pinName) => this._getPinNumberFromBridgedPinName(pinName))
            .filter((n): n is number => n !== null),
        ),
      ).sort((a, b) => a - b)
    } else if (props.bridged && resolvedPinCount) {
      bridgedPinNumbers = Array.from(
        { length: resolvedPinCount },
        (_, i) => i + 1,
      )
    }

    if (bridgedPinNumbers.length > 0) {
      symbolName += `_bridged${bridgedPinNumbers.join("")}`
    }
    return {
      schematicSymbolName: props.symbolName ?? symbolName,
      componentName: "SolderJumper",
      zodProps: solderjumperProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  _getSchematicPortArrangement() {
    const arrangement = super._getSchematicPortArrangement()
    if (arrangement && Object.keys(arrangement).length > 0) return arrangement

    let pinCount =
      this._parsedProps.pinCount ??
      (Array.isArray(this._parsedProps.pinLabels)
        ? this._parsedProps.pinLabels.length
        : this._parsedProps.pinLabels
          ? Object.keys(this._parsedProps.pinLabels).length
          : this.getPortsFromFootprint().length)

    if (pinCount == null && !this._parsedProps.footprint) {
      pinCount = 2
    }

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
