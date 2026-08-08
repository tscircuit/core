import { fuseProps } from "@tscircuit/props"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { formatSiUnit, parseAndConvertSiUnit } from "format-si-unit"

export class Fuse extends NormalComponent<typeof fuseProps, PassivePorts> {
  get config() {
    return {
      componentName: "fuse",
      schematicSymbolName: (this.props.symbolName ??
        ("fuse" as BaseSymbolName)) as BaseSymbolName,
      zodProps: fuseProps,
      sourceFtype: FTYPE.simple_fuse,
    }
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    if (this._parsedProps.schShowRatings === false) {
      return ""
    }

    const rawCurrent = this._parsedProps.currentRating
    const rawVoltage = this._parsedProps.voltageRating

    const current = parseAndConvertSiUnit(rawCurrent, "A").value

    const voltage = parseAndConvertSiUnit(rawVoltage, "V").value

    return `${formatSiUnit(current)}A / ${formatSiUnit(voltage)}V`
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const currentRating = parseAndConvertSiUnit(props.currentRating, "A").value

    const voltageRating = parseAndConvertSiUnit(props.voltageRating, "V").value

    let display_current_rating: string | undefined
    let display_voltage_rating: string | undefined

    if (props.schShowRatings !== false) {
      display_current_rating = `${formatSiUnit(currentRating)}A`
      display_voltage_rating = `${formatSiUnit(voltageRating)}V`
    }

    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_fuse,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      ...(currentRating != null ? { current_rating_amps: currentRating } : {}),
      ...(voltageRating != null ? { voltage_rating_volts: voltageRating } : {}),
      display_current_rating,
      display_voltage_rating,
      display_name: props.displayName,
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
