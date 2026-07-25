import { inductorProps } from "@tscircuit/props"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { formatSiUnit, parseAndConvertSiUnit } from "format-si-unit"
import type { SourceSimpleInductor } from "circuit-json"

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
      zodProps: inductorProps,
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
    // `maxCurrentRating` is declared on InductorProps and `max_current_rating`
    // exists on the simple_inductor schema, but the value was never carried
    // across. Unlike capacitor's `maxVoltageRating`, this prop has no zod
    // transform, so the raw string arrives here. `parseAndConvertSiUnit`
    // handles the unit suffix, so "500mA" becomes 0.5 rather than 500.
    const rawMaxCurrentRating = props.maxCurrentRating
    const maxCurrentRating =
      typeof rawMaxCurrentRating === "string"
        ? parseAndConvertSiUnit(rawMaxCurrentRating).value
        : rawMaxCurrentRating

    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_inductor,
      inductance: this.props.inductance,
      display_inductance: this._getSchematicSymbolDisplayValue(),
      max_current_rating:
        maxCurrentRating === undefined ||
        maxCurrentRating === null ||
        Number.isNaN(maxCurrentRating as number)
          ? undefined
          : maxCurrentRating,
      supplier_part_numbers: props.supplierPartNumbers,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as Omit<SourceSimpleInductor, "source_component_id" | "type">)
    this.source_component_id = source_component.source_component_id
  }
}
