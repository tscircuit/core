import { pushButtonProps } from "@tscircuit/props"
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

  get defaultInternallyConnectedPinNames(): string[][] {
    return []
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
    // Register the documented `side1`/`side2` aliases so connections like
    // connections={{ side1: "net.LEFT", side2: "net.RIGHT" }} resolve.
    // A 4-pin pushbutton has pins 1-2 on one side and 3-4 on the other.
    pin1Port.externallyAddedAliases.push("side1")
    pin2Port.externallyAddedAliases.push("side1")
    pin3Port.externallyAddedAliases.push("side2")
    pin4Port.externallyAddedAliases.push("side2")

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
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as SourceSimplePushButton)
    this.source_component_id = source_component.source_component_id
  }
}
