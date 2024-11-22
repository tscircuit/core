import { chipProps } from "@tscircuit/props"
import type { SchematicPortArrangement } from "circuit-json"
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
    const dimensions = this._getSchematicBoxDimensions()
    const hasTopAndBottomPins =
      props.schPortArrangement?.topSide !== undefined ||
      props.schPortArrangement?.bottomSide !== undefined
    const schematic_box_width = dimensions?.getSize().width
    const schematic_box_height = dimensions?.getSize().height
    const manufacturer_part_number_text = db.schematic_text.insert({
      text: props.manufacturerPartNumber ?? "",
      schematic_component_id: source_component.source_component_id,
      anchor: "left",
      rotation: 0,
      position: {
        x: hasTopAndBottomPins
          ? (props.schX ?? 0) + (schematic_box_width ?? 0) / 2 + 0.1
          : (props.schX ?? 0) - (schematic_box_width ?? 0) / 2,
        y: hasTopAndBottomPins
          ? (props.schY ?? 0) + (schematic_box_height ?? 0) / 2 + 0.35
          : (props.schY ?? 0) - (schematic_box_height ?? 0) / 2 - 0.13,
      },
      color: "#006464",
    })
    const component_name_text = db.schematic_text.insert({
      text: props.name ?? "",
      schematic_component_id: source_component.source_component_id,
      anchor: "left",
      rotation: 0,
      position: {
        x: hasTopAndBottomPins
          ? (props.schX ?? 0) + (schematic_box_width ?? 0) / 2 + 0.1
          : (props.schX ?? 0) - (schematic_box_width ?? 0) / 2,
        y: hasTopAndBottomPins
          ? (props.schY ?? 0) + (schematic_box_height ?? 0) / 2 + 0.55
          : (props.schY ?? 0) + (schematic_box_height ?? 0) / 2 + 0.13,
      },
      color: "#006464",
    })
    this.source_component_id = source_component.source_component_id!
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
