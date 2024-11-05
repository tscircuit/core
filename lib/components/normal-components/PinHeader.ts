import { pinHeaderProps, type SchematicPortArrangement } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import type { BaseSymbolName } from "lib/utils/constants"

export class PinHeader extends NormalComponent<typeof pinHeaderProps> {
  get config() {
    return {
      componentName: "PinHeader",
      zodProps: pinHeaderProps,
      shouldRenderAsSchematicBox: true,
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

  _getSchematicPortArrangement(): SchematicPortArrangement | null {
    return {
      leftSize: 0,
      rightSize: this._parsedProps.pinCount ?? 1,
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
}
