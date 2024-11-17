import { pushButtonProps } from "@tscircuit/props"
import type { SourceSimplePushbutton } from "circuit-json"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
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

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["side1"],
        pin3: ["side2"],
      },
    })
  }
  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: props.name,
      ftype: FTYPE.simple_push_button,
      supplier_part_numbers: props.supplierPartNumbers,
    } as SourceSimplePushbutton)
    this.source_component_id = source_component.source_component_id
  }
}
