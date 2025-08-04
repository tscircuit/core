import { pushButtonProps } from "@tscircuit/props"
import type { SourceSimplePushButton } from "circuit-json"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
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

  // getSchematicSymbolPinNumberFromSourcePinNumber(sourcePinNumber: number) {
  //   // TODO use internallyConnectedPins to determine the correct pin number
  //   if (sourcePinNumber === 1) {
  //     return 1
  //   }
  //   if (sourcePinNumber === 2) {
  //     return 1
  //   }
  //   if (sourcePinNumber === 3) {
  //     return 2
  //   }
  //   if (sourcePinNumber === 4) {
  //     return 2
  //   }
  //   return sourcePinNumber
  // }

  override initPorts() {
    super.initPorts({
      ignoreSymbolPorts: true,
    })

    // // Hmm, are these ports in the correct positions?
    const ports = this.selectAll("port")

    console.log(ports)

    // const { internallyConnectedPins } = this._parsedProps

    // // If the user has internally connected pin1 and pin2, then that means that
    // // pin1 and pin2 are BOTH on the left

    // const pin1Port = ports.find((p) => p.props.pinNumber === 1)
    // const pin2Port = ports.find((p) => p.props.pinNumber === 2)
    // const pin3Port = ports.find((p) => p.props.pinNumber === 3)
    // const pin4Port = ports.find((p) => p.props.pinNumber === 4)

    // if (
    //   internallyConnectedPins?.some(
    //     ([pin1, pin2]) =>
    //       // (pin1 === 1 && pin2 === 2) ||
    //       // (pin1 === 2 && pin2 === 1) ||
    //       (pin1 === "pin2" && pin2 === "pin1") ||
    //       (pin1 === "pin2" && pin2 === "pin1"),
    //   )
    // ) {
    //   pin1Port.
    // }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_push_button,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
    } as SourceSimplePushButton)
    this.source_component_id = source_component.source_component_id
  }
}
