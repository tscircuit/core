import { testpointProps } from "@tscircuit/props"
import type { SourceSimpleTestPoint } from "circuit-json"
import { FTYPE, type BaseSymbolName } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

export class TestPoint extends NormalComponent<typeof testpointProps> {
  get config() {
    return {
      componentName: "TestPoint",
      schematicSymbolName: this.props.symbolName ?? "testpoint",
      zodProps: testpointProps,
      sourceFtype: FTYPE.simple_test_point,
    }
  }

  _getImpliedFootprintString(): string | null {
    let {
      padShape,
      holeDiameter,
      footprintVariant,
      // TODO SMTPAD
      padDiameter,
      width,
      height,
    } = this._parsedProps

    if (!footprintVariant && holeDiameter) {
      footprintVariant = "through_hole"
    }

    footprintVariant ??= "through_hole"
    padShape ??= "circle"

    if (footprintVariant === "through_hole") {
      holeDiameter ??= 0.5
      return `platedhole_d${holeDiameter}`
    }

    throw new Error(`Footprint variant "${footprintVariant}" not implemented`)
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: FTYPE.simple_test_point,
      name: props.name,
      supplier_part_numbers: props.supplierPartNumbers,
      footprint_variant: props.footprintVariant,
      pad_shape: props.padShape,
      pad_diameter: props.padDiameter,
      hole_diameter: props.holeDiameter,
      width: props.width,
      height: props.height,
      are_pins_interchangeable: true,
    } as SourceSimpleTestPoint)
    this.source_component_id = source_component.source_component_id
  }
}
