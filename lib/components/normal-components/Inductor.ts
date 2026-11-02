import { inductorProps, resolveManufacturerPartNumber } from "@tscircuit/props"
import type { SourceSimpleInductor } from "circuit-json"
import { formatSiUnit, parseAndConvertSiUnit } from "format-si-unit"
import {
  type BaseSymbolName,
  FTYPE,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"

const validatedInductorProps = inductorProps.extend({
  inductance: inductorProps.shape.inductance.refine(
    (val) => typeof val === "number" && Number.isFinite(val) && val > 0,
    "Inductance must be a positive finite numeric value or valid unit string",
  ),
})

export class Inductor extends NormalComponent<
  typeof inductorProps,
  PassivePorts
> {
  _adjustSilkscreenTextAutomatically = true

  get config() {
    return {
      componentName: "Inductor",
      schematicSymbolName: (this.props.symbolName ??
        ("inductor" as BaseSymbolName)) as BaseSymbolName,
      zodProps: validatedInductorProps,
      sourceFtype: FTYPE.simple_inductor,
    }
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.inductance)}H`
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_inductor,
      inductance: props.inductance,
      max_current_rating:
        props.maxCurrentRating === undefined
          ? undefined
          : parseAndConvertSiUnit(props.maxCurrentRating, "A").value,
      display_inductance: this._getSchematicSymbolDisplayValue(),
      supplier_part_numbers: props.supplierPartNumbers,
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as Omit<SourceSimpleInductor, "source_component_id" | "type">)
    this.source_component_id = source_component.source_component_id
  }
}
