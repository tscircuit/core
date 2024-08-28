import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { chipProps } from "@tscircuit/props"
import { Port } from "../primitive-components/Port"
import type { BaseSymbolName } from "lib/utils/constants"
import {
  getAllDimensionsForSchematicBox,
  type SchematicBoxDimensions,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"

export class Chip<PinLabels extends string = never> extends NormalComponent<
  typeof chipProps,
  PinLabels
> {
  schematicDimensions: SchematicBoxDimensions | null = null

  get config() {
    return {
      zodProps: chipProps,
    }
  }

  initPorts() {
    super.initPorts()

    const { _parsedProps: props } = this

    if (props.pinLabels) {
      for (const [pinNumber, label] of Object.entries(props.pinLabels)) {
        const port = this.selectOne(`port[pinNumber='${pinNumber}']`)
        if (!port) {
          throw new Error(
            `Could not find port for pin number ${pinNumber} in chip ${this.getString()}`,
          )
        }
        port.props.aliases.push(port.props.name)
        port.props.name = label
      }
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.project!
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
    const { db } = this.project!
    const { _parsedProps: props } = this

    const pinSpacing = props.schPinSpacing ?? 0.2

    const dimensions = getAllDimensionsForSchematicBox({
      schWidth: props.schWidth,
      schHeight: props.schHeight,
      schPinSpacing: pinSpacing,
      schPinStyle: props.schPinStyle,

      // @ts-ignore there's a subtley in the definition difference with
      // leftSide/rightSide/topSide/bottomSide in how the direction is defined
      // that doesn't really matter
      schPortArrangement: props.schPortArrangement,
    })
    this.schematicDimensions = dimensions

    console.log(dimensions)

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

      port_labels: props.pinLabels,

      source_component_id: this.source_component_id!,
    })

    this.schematic_component_id = schematic_component.schematic_component_id
  }

  doInitialPcbComponentRender() {
    const { db } = this.project!
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
