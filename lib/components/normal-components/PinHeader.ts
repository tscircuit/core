import { pinHeaderProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import type { BaseSymbolName } from "lib/utils/constants"

export class PinHeader extends NormalComponent<typeof pinHeaderProps> {
  get config() {
    return {
      componentName: "PinHeader",
      zodProps: pinHeaderProps,
      schematicSymbolName: "pinrow_horz" as BaseSymbolName,
    }
  }

  _getImpliedFootprintString(): string | null {
    const pinCount =
      this._parsedProps.pinCount ?? this._parsedProps.pinLabels?.length ?? 0
    const holeDiameter = this._parsedProps.holeDiameter
    const platedDiameter = this._parsedProps.platedDiameter
    const pitch = this._parsedProps.pitch
    if (pinCount > 0 && pitch) {
      if (!holeDiameter && !platedDiameter) {
        return `pinrow${pinCount}_p${pitch}`
      }
      return `pinrow${pinCount}_p${pitch}_id${holeDiameter}_od${platedDiameter}`
    }
    return null
  }

  initPorts() {
    const pinCount =
      this._parsedProps.pinCount ?? this._parsedProps.pinLabels?.length ?? 1
    for (let i = 1; i <= pinCount; i++) {
      this.add(
        new Port({
          name: `pin${i}`,
          pinNumber: i,
          aliases: [],
        }),
      )
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_chip",
      name: props.name,
      // manufacturer_part_number: props.,
      supplier_part_numbers: props.supplierPartNumbers,
      // gender: props.gender,
      // pitch: props.pitch,
    })

    this.source_component_id = source_component.source_component_id
  }

  doInitialSchematicComponentRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const schematic_component = db.schematic_component.insert({
      center: { x: props.schX ?? 0, y: props.schY ?? 0 },
      rotation: props.schRotation ?? 0,
      size: { width: 2, height: props.pinCount ?? 1 },
      source_component_id: this.source_component_id!,
      port_arrangement: {
        left_size: 0,
        right_size: props.pinCount ?? 1,
      },
    })

    this.schematic_component_id = schematic_component.schematic_component_id
  }
}
