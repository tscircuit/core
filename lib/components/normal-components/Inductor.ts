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

  /**
   * The inductor's maxCurrentRating prop is typed as `number | string` and has
   * no zod transform, so a raw value like "500mA" reaches the component. Parse
   * it to amperes the same way circuit-json's `current` schema does, so
   * "500mA" becomes 0.5 rather than 500. A missing, blank or unparseable value
   * leaves max_current_rating unset.
   */
  _getMaxCurrentRating(): number | undefined {
    const { maxCurrentRating } = this._parsedProps
    if (maxCurrentRating === undefined) return undefined
    if (
      typeof maxCurrentRating === "string" &&
      maxCurrentRating.trim() === ""
    ) {
      return undefined
    }
    const value = parseAndConvertSiUnit(maxCurrentRating, "A").value
    return Number.isFinite(value) ? (value as number) : undefined
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
      inductance: this.props.inductance,
      display_inductance: this._getSchematicSymbolDisplayValue(),
      supplier_part_numbers: props.supplierPartNumbers,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      are_pins_interchangeable: true,
      display_name: props.displayName,
      max_current_rating: this._getMaxCurrentRating(),
    } as Omit<SourceSimpleInductor, "source_component_id" | "type">)
    this.source_component_id = source_component.source_component_id
  }
}
