import { testpointProps } from "@tscircuit/props"
import type { SourceSimpleTestPoint } from "circuit-json"
import { FTYPE, type BaseSymbolName } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

export class TestPoint extends NormalComponent<typeof testpointProps> {
  get config() {
    return {
      componentName: "TestPoint",
      schematicSymbolName: (this.props.symbolName ??
        ("testpoint" as BaseSymbolName)) as BaseSymbolName,
      zodProps: testpointProps,
      sourceFtype: FTYPE.simple_test_point,
    }
  }

  initPorts() {
    super.initPorts({ pinCount: 1 })
  }

  _getImpliedFootprintString(): string | null {
    const {
      padDiameter,
      padShape,
      holeDiameter,
      footprintVariant,
      width,
      height,
    } = this._parsedProps
    const parts = ["tp"]
    if (footprintVariant) parts.push(footprintVariant)
    if (padShape && footprintVariant === "pad") parts.push(padShape)
    if (padDiameter) parts.push(`pd${padDiameter}`)
    if (holeDiameter) parts.push(`hd${holeDiameter}`)
    if (width) parts.push(`w${width}`)
    if (height) parts.push(`h${height}`)
    return parts.join("_")
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
