import { inductorProps } from "@tscircuit/props"
import type { SourceSimpleInductor } from "circuit-json"
import { FTYPE, type BaseSymbolName,type PassivePorts } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"

export class Inductor extends NormalComponent<
  typeof inductorProps,
  PassivePorts
> {
  get config() {
    return {
      componentName: "Inductor",
      schematicSymbolName: (this.props.symbolName ??
        ("inductor" as BaseSymbolName)) as BaseSymbolName,
      zodProps: inductorProps,
      sourceFtype: FTYPE.simple_inductor,
    }
  }

  initPorts() {
    this.add(
      new Port({
        name: "pin1",
        pinNumber: 1,
        aliases: ["anode", "pos", "left"],
      }),
    )
    this.add(
      new Port({
        name: "pin2",
        pinNumber: 2,
        aliases: ["cathode", "neg", "right"],
      }),
    )
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: props.name,
      ftype: FTYPE.simple_inductor,
      inductance: props.inductance,
      supplier_part_numbers: props.supplierPartNumbers,
    } as SourceSimpleInductor)
    this.source_component_id = source_component.source_component_id
  }
}
