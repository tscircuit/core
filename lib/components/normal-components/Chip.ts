import { chipProps } from "@tscircuit/props"
import type { SchematicPortArrangement } from "circuit-json"
import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import {
  type SchematicBoxDimensions,
  getAllDimensionsForSchematicBox,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { Trace } from "lib/components/primitive-components/Trace/Trace"

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

  doInitialSchematicComponentRender(): void {
    const { _parsedProps: props } = this
    // Early return if noSchematicRepresentation is true
    if (props?.noSchematicRepresentation === true) return

    // Continue with normal schematic rendering
    super.doInitialSchematicComponentRender()
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
    })

    this.pcb_component_id = pcb_component.pcb_component_id

    for (const [pin1, pin2] of props.externallyConnectedPins) {
      this.add(
        new Trace({
          from: `.${this._parsedProps.name} .${pin1}`,
          to: `.${this._parsedProps.name} .${pin2}`,
        }),
      )
    }
  }
}
