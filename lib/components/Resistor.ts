import type { resistorProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"

export class Resistor extends BaseComponent<typeof resistorProps> {
  schematicSymbolName = "boxresistor" as const

  doInitialSourceRender() {
    const { db } = this.project!
    const { props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_resistor",
      name: props.name,
      manufacturer_part_number:
        // @ts-expect-error - TODO should be fixed in @tscircuit/props
        props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
    })

    this.source_component_id = source_component.source_component_id
  }

  doInitialPcbComponentRender() {}
}
