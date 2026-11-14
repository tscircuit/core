import {
  pushButtonProps,
  resolveManufacturerPartNumber,
} from "@tscircuit/props"
import type { SourceSimplePushButton } from "circuit-json"
import {
  type BaseSymbolName,
  FTYPE,
  type PassivePorts,
} from "lib/utils/constants"
import { isValidElement } from "react"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"

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

  get defaultInternallyConnectedPinNames(): string[][] {
    return []
  }

  override initPorts() {
    const hasPendingReactSymbol =
      isValidElement(this.props.symbol) &&
      !this.children.some((child) => child.componentName === "Symbol")
    if (hasPendingReactSymbol) return

    const existingChildPorts = this._getAllPortsFromChildren()
    const hasCustomSymbolPorts = existingChildPorts.some(
      (port) => port._getSymbolAncestor() !== null,
    )

    if (hasCustomSymbolPorts) {
      super.initPorts()
      return
    }

    super.initPorts({
      pinCount: 2,
      ignoreSymbolPorts: true,
    })

    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!

    const symPort1 = symbol.ports.find((p) => p.labels.includes("1"))
    const symPort2 = symbol.ports.find((p) => p.labels.includes("2"))

    const ports = this.selectAll<Port>("port")
    const pin1Port = ports.find((port) => port.props.pinNumber === 1)!
    if (!pin1Port) return
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
