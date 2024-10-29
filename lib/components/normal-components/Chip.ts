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
  schematicDimensions: SchematicBoxDimensions | null = null

  get config() {
    return {
      componentName: "Chip",
      zodProps: chipProps,
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

  doInitialSchematicComponentRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const pinCountFromSchArrangement =
      (props.schPortArrangement?.leftSize ?? 0) +
      (props.schPortArrangement?.rightSize ?? 0) +
      (props.schPortArrangement?.topSize ?? 0) +
      (props.schPortArrangement?.bottomSize ?? 0)
    const pinCount = pinCountFromSchArrangement || this.getPortsFromFootprint().length

    const pinSpacing = props.schPinSpacing ?? 0.2

    const dimensions = getAllDimensionsForSchematicBox({
      schWidth: props.schWidth,
      schHeight: props.schHeight,
      schPinSpacing: pinSpacing,
      schPinStyle: props.schPinStyle,

      pinCount,

      // @ts-ignore there's a subtley in the definition difference with
      // leftSide/rightSide/topSide/bottomSide in how the direction is defined
      // that doesn't really matter
      schPortArrangement: props.schPortArrangement,
    })
    this.schematicDimensions = dimensions

    const primaryPortLabels: Record<string, string> = {}
    for (const [port, label] of Object.entries(props.pinLabels ?? {})) {
      primaryPortLabels[port] = Array.isArray(label) ? label[0] : label
    }

    const schematic_component = db.schematic_component.insert({
      center: { x: props.schX ?? 0, y: props.schY ?? 0 },
      rotation: props.schRotation ?? 0,
      size: dimensions.getSize(),

      port_arrangement: underscorifyPortArrangement(
        props.schPortArrangement as any,
      ),

      pin_spacing: pinSpacing,

      // @ts-ignore soup needs to support distance for pin_styles
      pin_styles: underscorifyPinStyles(props.schPinStyle),

      port_labels: primaryPortLabels,

      source_component_id: this.source_component_id!,
    })

    this.schematic_component_id = schematic_component.schematic_component_id
  }

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
