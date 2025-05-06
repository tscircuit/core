import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { jumperProps } from "@tscircuit/props"
import { Port } from "../primitive-components/Port"
import type { BaseSymbolName } from "lib/utils/constants"
import {
  getAllDimensionsForSchematicBox,
  type SchematicBoxDimensions,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"

export class Jumper<PinLabels extends string = never> extends NormalComponent<
  typeof jumperProps,
  PinLabels
> {
  schematicDimensions: SchematicBoxDimensions | null = null

  get config() {
    return {
      componentName: "Jumper",
      zodProps: jumperProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_chip", // TODO unknown or jumper
      name: props.name,
      manufacturer_part_number: props.manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
    })
    this.source_component_id = source_component.source_component_id!
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const pcb_component = db.pcb_component.insert({
      center: { x: props.pcbX ?? 0, y: props.pcbY ?? 0 },
      width: 2, // Default width, adjust as needed
      height: 3, // Default height, adjust as needed
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.pcb_component_id = pcb_component.pcb_component_id
  }
}
