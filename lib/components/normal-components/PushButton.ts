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
    // A 4-leg tactile switch has four physical legs. Hardcoding pinCount: 2
    // meant pins 3 and 4 never got ports — so those pads had no pcb_port, could
    // not join a net, and vanished from connectivity analysis entirely. (It also
    // left the pin3/pin4 lookups below undefined, which is what crashed when
    // internallyConnectedPins was set.)
    //
    // With a footprint, let NormalComponent derive the ports from it, so a
    // 4-leg part gets 4 and a 2-pin part gets 2. With no footprint there is
    // nothing to derive from, so keep the historical 2-pin default — a bare
    // <pushbutton /> is still a two-terminal switch schematically.
    const hasFootprint = Boolean(this.props.footprint)
    super.initPorts({
      ...(hasFootprint ? {} : { pinCount: 2 }),
      ignoreSymbolPorts: true,
    })

    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!

    const symPort1 = symbol.ports.find((p) => p.labels.includes("1"))
    const symPort2 = symbol.ports.find((p) => p.labels.includes("2"))

    const ports = this.selectAll("port")
    const getPortByPinNumber = (pinNumber: number) =>
      ports.find((p) => p.props.pinNumber === pinNumber) as Port | undefined

    const pin1Port = getPortByPinNumber(1)
    const { internallyConnectedPins } = this._parsedProps

    // The schematic symbol only ever has two terminals ("1" and "2") — the
    // extra legs of a 4-leg switch are the same two electrical nodes — so the
    // mapping below assigns the symbol's second terminal to whichever pin
    // represents it.
    if (pin1Port) pin1Port.schematicSymbolPortDef = symPort1!

    const pin2Port = getPortByPinNumber(2)
    if (
      pin2Port &&
      (!internallyConnectedPins || internallyConnectedPins.length === 0)
    ) {
      pin2Port.schematicSymbolPortDef = symPort2!
    }

    // Find the lowest-numbered pin that's not connected to pin1
    for (const pn of [2, 3, 4] as const) {
      const port = getPortByPinNumber(pn)
      // A 2-pin pushbutton simply has no pin3/pin4 — skip rather than crash.
      if (!port) continue

      const internallyConnectedRow = internallyConnectedPins?.find(
        ([pin1, pin2]) => pin1 === `pin${pn}` || pin2 === `pin${pn}`,
      )
      if (!internallyConnectedRow) {
        port.schematicSymbolPortDef = symPort2!
        break
      }
      const internallyConnectedTo =
        internallyConnectedRow?.[0] === `pin${pn}`
          ? internallyConnectedRow[1]
          : internallyConnectedRow?.[0]
      if (internallyConnectedTo === "pin1") {
        continue
      }
      port.schematicSymbolPortDef = symPort2!
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
