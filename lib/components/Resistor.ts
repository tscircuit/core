import type { resistorProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"

export class Resistor extends BaseComponent<typeof resistorProps> {
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

  doInitialSchematicRender() {
    const { db } = this.project!
    const { footprint, resistance, schX, schY, schRotation } = this.props
    const schematic_component = db.schematic_component.insert({
      center: { x: schX ?? 0, y: schY ?? 0 },
      rotation: schRotation ?? 0,

      // TODO this should be computed using the schematic-symbol library
      size: { width: 1, height: 0.6 },

      source_component_id: this.source_component_id!,

      port_labels: {},
    })
    this.schematic_component_id = schematic_component.schematic_component_id
  }

  doInitialPcbComponentRender() {}
}
