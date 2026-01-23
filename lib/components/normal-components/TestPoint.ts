import { testpointProps } from "@tscircuit/props"
import type { SourceSimpleTestPoint } from "circuit-json"
import { FTYPE, type BaseSymbolName } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

const TESTPOINT_DEFAULTS = {
  HOLE_DIAMETER: 0.5,
  SMT_CIRCLE_DIAMETER: 1.2,
  SMT_RECT_SIZE: 2,
} as const

export class TestPoint extends NormalComponent<typeof testpointProps> {
  get config() {
    return {
      componentName: "TestPoint",
      schematicSymbolName: this.props.symbolName ?? "testpoint",
      zodProps: testpointProps,
      sourceFtype: FTYPE.simple_test_point,
    }
  }

  private _getPropsWithDefaults() {
    let {
      padShape,
      holeDiameter,
      footprintVariant,
      padDiameter,
      width,
      height,
    } = this._parsedProps

    if (!footprintVariant && holeDiameter) {
      footprintVariant = "through_hole"
    }

    footprintVariant ??= "through_hole"
    padShape ??= "circle"

    // Apply defaults for SMT pads
    if (footprintVariant === "pad") {
      if (padShape === "circle") {
        padDiameter ??= TESTPOINT_DEFAULTS.SMT_CIRCLE_DIAMETER
      } else if (padShape === "rect") {
        width ??= TESTPOINT_DEFAULTS.SMT_RECT_SIZE
        height ??= width
      }
    } else if (footprintVariant === "through_hole") {
      holeDiameter ??= TESTPOINT_DEFAULTS.HOLE_DIAMETER
    }

    return {
      padShape,
      holeDiameter,
      footprintVariant,
      padDiameter,
      width,
      height,
    }
  }

  _getImpliedFootprintString(): string | null {
    const {
      padShape,
      holeDiameter,
      footprintVariant,
      padDiameter,
      width,
      height,
    } = this._getPropsWithDefaults()

    if (footprintVariant === "through_hole") {
      return `platedhole_d${holeDiameter}`
    }

    if (footprintVariant === "pad") {
      if (padShape === "circle") {
        return `smtpad_circle_d${padDiameter}`
      }

      if (padShape === "rect") {
        return `smtpad_rect_w${width}_h${height}`
      }
    }

    throw new Error(
      `Footprint variant "${footprintVariant}" with pad shape "${padShape}" not implemented`,
    )
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const {
      padShape,
      holeDiameter,
      footprintVariant,
      padDiameter,
      width,
      height,
    } = this._getPropsWithDefaults()

    const source_component = db.source_component.insert({
      ftype: FTYPE.simple_test_point,
      name: this.name,
      supplier_part_numbers: props.supplierPartNumbers,
      footprint_variant: footprintVariant,
      pad_shape: padShape,
      pad_diameter: padDiameter,
      hole_diameter: holeDiameter,
      width: width,
      height: height,
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as SourceSimpleTestPoint)
    this.source_component_id = source_component.source_component_id
  }
}
