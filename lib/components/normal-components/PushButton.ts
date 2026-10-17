import {
  pushButtonProps,
  resolveManufacturerPartNumber,
} from "@tscircuit/props"
import type { SourceSimplePushButton } from "circuit-json"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { symbols } from "schematic-symbols"

export class PushButton extends NormalComponent<
  typeof pushButtonProps,
  PassivePorts
> {
  get config() {
    return {
      componentName: "PushButton",
      schematicSymbolName: (this.props.symbolName ??
        ("push_button_normally_open_momentary" as BaseSymbolName)) as BaseSymbolName,
      zodProps: pushButtonProps,
      sourceFtype: FTYPE.simple_push_button,
    }
  }

  private _includeDefaultInternalConnections = false

  get defaultInternallyConnectedPinNames(): string[][] {
    const ports = this.selectAll<Port>("port")
    const portNames = new Set(ports.map((port) => port.props.name))
    if (
      portNames.has("pin1") &&
      portNames.has("pin2") &&
      portNames.has("pin3") &&
      portNames.has("pin4")
    ) {
      const pin2Port = ports.find((p) => p.props.pinNumber === 2)
      const pin3Port = ports.find((p) => p.props.pinNumber === 3)
      const pin4Port = ports.find((p) => p.props.pinNumber === 4)
      const subcircuit = this.getSubcircuit()
      if (subcircuit && pin2Port) {
        const traces = subcircuit.selectAll("trace") as any[]
        const referencedPorts = new Set<Port>()
        for (const trace of traces) {
          const selectors = [
            trace._parsedProps?.from,
            trace._parsedProps?.to,
            ...(trace._parsedProps?.path ?? []),
          ].filter((s): s is string => typeof s === "string")
          for (const sel of selectors) {
            if (!this.name || !sel.includes(this.name)) continue
            const targetPort = subcircuit.selectOne(sel, {
              type: "port",
            }) as Port | null
            if (targetPort) referencedPorts.add(targetPort)
          }
        }
        if (
          referencedPorts.has(pin2Port) &&
          (!pin3Port || !referencedPorts.has(pin3Port)) &&
          (!pin4Port || !referencedPorts.has(pin4Port))
        ) {
          return []
        }
      }
      return [
        ["pin1", "pin2"],
        ["pin3", "pin4"],
      ]
    }
    return []
  }

  override _getInternallyConnectedPins(): Port[][] {
    if (
      !this._includeDefaultInternalConnections &&
      this._parsedProps.internallyConnectedPins === undefined &&
      this._importedInternallyConnectedPinNames === undefined &&
      this._inferredInternallyConnectedPinNames.length === 0
    ) {
      return []
    }
    return super._getInternallyConnectedPins()
  }

  override doInitialSourceParentAttachment(): void {
    this._includeDefaultInternalConnections = true
    try {
      super.doInitialSourceParentAttachment()
    } finally {
      this._includeDefaultInternalConnections = false
    }
  }

  override initPorts() {
    super.initPorts({
      pinCount: 2,
      ignoreSymbolPorts: true,
    })

    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!

    const symPort1 = symbol.ports.find((p) => p.labels.includes("1"))
    const symPort2 = symbol.ports.find((p) => p.labels.includes("2"))

    const ports = this.selectAll<Port>("port")
    const pin1Port = ports.find((port) => port.props.pinNumber === 1)!
    pin1Port.schematicSymbolPortDef = symPort1!

    // Each symbol terminal has one physical owner. Other pads inherit that
    // terminal through their resolved internal connections (including aliases
    // and numeric pin declarations), rather than defining duplicate terminals.
    const firstTerminalPorts = new Set(
      pin1Port._getPortsInternallyConnectedToThisPort(),
    )
    const secondTerminalPort = ports
      .filter((port) => port !== pin1Port && !firstTerminalPorts.has(port))
      .sort((a, b) => (a.props.pinNumber ?? 0) - (b.props.pinNumber ?? 0))[0]
    if (secondTerminalPort) {
      secondTerminalPort.schematicSymbolPortDef = symPort2!
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_push_button,
      supplier_part_numbers: props.supplierPartNumbers,
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as SourceSimplePushButton)
    this.source_component_id = source_component.source_component_id
  }
}
