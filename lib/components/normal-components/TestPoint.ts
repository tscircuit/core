import { testpointProps } from "@tscircuit/props"
import type { SourceSimpleTestPoint } from "circuit-json"
import { FTYPE } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { z } from "zod"

const TESTPOINT_DEFAULTS = {
  HOLE_DIAMETER: 0.5,
  SMT_CIRCLE_DIAMETER: 1.2,
  SMT_RECT_SIZE: 2,
} as const

const extendedTestpointProps = testpointProps.and(
  z.object({
    withoutHole: z.boolean().optional(),
    withouthole: z.boolean().optional(),
  }),
)

export class TestPoint extends NormalComponent<typeof extendedTestpointProps> {
  get config() {
    return {
      componentName: "TestPoint",
      schematicSymbolName: this.props.symbolName ?? "testpoint",
      zodProps: extendedTestpointProps,
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
      withoutHole,
      withouthole,
    } = this._parsedProps

    withoutHole = withoutHole ?? withouthole

    if (!footprintVariant && holeDiameter) {
      footprintVariant = "through_hole"
    }

    if (withoutHole) {
      footprintVariant = "pad"
      padShape = "circle"
      holeDiameter = undefined
    } else {
      footprintVariant ??= "through_hole"
      padShape ??= "circle"
    }

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
    } as SourceSimpleTestPoint)
    this.source_component_id = source_component.source_component_id
  }
}
