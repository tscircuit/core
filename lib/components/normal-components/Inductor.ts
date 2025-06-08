import { inductorProps } from "@tscircuit/props"
import type { SourceSimpleInductor } from "circuit-json"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { formatSiUnit } from "format-si-unit"

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

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.inductance)}H` // Corrected unit to "H"
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: props.name,
      ftype: FTYPE.simple_inductor,
      inductance: props.inductance,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
    } as SourceSimpleInductor)
    this.source_component_id = source_component.source_component_id
  }
}
