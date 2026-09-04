import { pushButtonProps } from "@tscircuit/props"
import type { SourceSimplePushButton } from "circuit-json"
import {
  type BaseSymbolName,
  FTYPE,
  type PassivePorts,
} from "lib/utils/constants"
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
    super.initPorts({
      pinCount: 2,
      ignoreSymbolPorts: true,
    })

    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!

    const symPort1 = symbol.ports.find((p) => p.labels.includes("1"))
    const symPort2 = symbol.ports.find((p) => p.labels.includes("2"))

    const ports = this.selectAll("port")
    const pin1Port = ports.find((p) => p.props.pinNumber === 1)! as Port
    const pin2Port = ports.find((p) => p.props.pinNumber === 2)! as Port
    const pin3Port = ports.find((p) => p.props.pinNumber === 3)! as Port
    const pin4Port = ports.find((p) => p.props.pinNumber === 4)! as Port

    const { internallyConnectedPins } = this._parsedProps

    pin1Port.schematicSymbolPortDef = symPort1!

    if (!internallyConnectedPins || internallyConnectedPins.length === 0) {
      pin2Port.schematicSymbolPortDef = symPort2!
    }

    // Find the lowest-numbered pin that's not connected to pin1
    for (const [pn, port] of [
      [2, pin2Port],
      [3, pin3Port],
      [4, pin4Port],
    ] as const) {
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

  override doInitialSourceDesignRuleChecks(): void {
    super.doInitialSourceDesignRuleChecks()

    const schematicContactPorts = (this.selectAll("port") as Port[]).filter(
      (port) => port.schematicSymbolPortDef,
    )
    if (schematicContactPorts.length !== 2) return

    const sourcePorts = schematicContactPorts.map((port) =>
      this.root!.db.source_port.get(port.source_port_id!),
    )
    const [firstContact, secondContact] = sourcePorts
    if (!firstContact?.subcircuit_connectivity_map_key) return
    if (
      firstContact.subcircuit_connectivity_map_key !==
      secondContact?.subcircuit_connectivity_map_key
    ) {
      return
    }

    this.root!.db.source_component_misconfigured_error.insert({
      error_type: "source_component_misconfigured_error",
      message: `Pushbutton ${this.name} has both schematic contacts connected to the same net. Check its internallyConnectedPins and footprint pin mapping.`,
      source_component_ids: [this.source_component_id!],
      source_port_ids: sourcePorts.map(
        (sourcePort) => sourcePort!.source_port_id,
      ),
      is_fatal: true,
    })
  }
}
