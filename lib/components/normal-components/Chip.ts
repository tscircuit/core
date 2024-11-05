import { chipProps } from "@tscircuit/props"
import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import {
  type SchematicBoxDimensions,
  getAllDimensionsForSchematicBox,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"

export class Chip<PinLabels extends string = never> extends NormalComponent<
  typeof chipProps,
  PinLabels
> {
  schematicBoxDimensions: SchematicBoxDimensions | null = null

  get config() {
    return {
      componentName: "Chip",
      zodProps: chipProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_chip",
      name: props.name,
      manufacturer_part_number: props.manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
    })

    this.source_component_id = source_component.source_component_id!
  }

  // doInitialSchematicComponentRender() {
  //   const { db } = this.root!
  //   const { _parsedProps: props } = this
  //   const dimensions = this._getSchematicBoxDimensions()!
  //   this.schematicBoxDimensions = dimensions

  //   const primaryPortLabels: Record<string, string> = {}
  //   for (const [port, label] of Object.entries(props.pinLabels ?? {})) {
  //     primaryPortLabels[port] = Array.isArray(label) ? label[0] : label
  //   }

  //   const schematic_component = db.schematic_component.insert({
  //     center: { x: props.schX ?? 0, y: props.schY ?? 0 },
  //     rotation: props.schRotation ?? 0,
  //     size: dimensions.getSize(),

  //     port_arrangement: underscorifyPortArrangement(
  //       props.schPortArrangement as any,
  //     ),

  //     pin_spacing: props.schPinSpacing ?? 0.2,

  //     // @ts-ignore soup needs to support distance for pin_styles
  //     pin_styles: underscorifyPinStyles(props.schPinStyle),

  //     port_labels: primaryPortLabels,

  //     source_component_id: this.source_component_id!,
  //   })

  //   this.schematic_component_id = schematic_component.schematic_component_id
  // }

  doInitialPcbComponentRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const pcb_component = db.pcb_component.insert({
      center: { x: props.pcbX ?? 0, y: props.pcbY ?? 0 },
      width: 2, // Default width, adjust as needed
      height: 3, // Default height, adjust as needed
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
    })

    this.pcb_component_id = pcb_component.pcb_component_id
  }
}
