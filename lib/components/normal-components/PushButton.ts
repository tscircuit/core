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
    const { pinLabels } = this._parsedProps

    if (pinLabels) {
      if (Array.isArray(pinLabels) && pinLabels.length < 4) {
        return []
      }

      if (
        !Array.isArray(pinLabels) &&
        !("pin3" in pinLabels) &&
        !("pin4" in pinLabels)
      ) {
        return []
      }
    }

    const pinNumbers = new Set(
      this._getAllPortsFromChildren()
        .map((port) => port.props.pinNumber)
        .filter(
          (pinNumber): pinNumber is number => typeof pinNumber === "number",
        ),
    )

    if (![1, 2, 3, 4].every((pinNumber) => pinNumbers.has(pinNumber))) {
      return []
    }

    return [
      ["pin1", "pin2"],
      ["pin3", "pin4"],
    ]
  }

  override initPorts() {
    super.initPorts({
      pinCount: 2,
      ignoreSymbolPorts: true,
    })

    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!

    const symPort1 = symbol.ports.find((p) => p.labels.includes("1"))
    const symPort2 = symbol.ports.find((p) => p.labels.includes("2"))

    const ports = this.selectAll("port") as Port[]
    const pin1Port = ports.find((p) => p.props.pinNumber === 1) as
      | Port
      | undefined
    const pin2Port = ports.find((p) => p.props.pinNumber === 2) as
      | Port
      | undefined

    const internallyConnectedPins = this.internallyConnectedPinNames

    if (!pin1Port || !pin2Port) return

    pin1Port.schematicSymbolPortDef = symPort1!

    if (!internallyConnectedPins || internallyConnectedPins.length === 0) {
      pin2Port.schematicSymbolPortDef = symPort2!
      return
    }

    // Find the lowest-numbered pin that's not connected to pin1
    for (const port of ports
      .filter((port) => {
        const pinNumber = port.props.pinNumber
        return typeof pinNumber === "number" && pinNumber >= 2 && pinNumber <= 4
      })
      .sort(
        (portA, portB) => portA.props.pinNumber! - portB.props.pinNumber!,
      )) {
      const pn = port.props.pinNumber!
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
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as SourceSimplePushButton)
    this.source_component_id = source_component.source_component_id
  }
}
