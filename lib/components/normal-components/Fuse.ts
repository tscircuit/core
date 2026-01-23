import { fuseProps } from "@tscircuit/props"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { formatSiUnit } from "format-si-unit"

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
    const rawCurrent = this._parsedProps.currentRating
    const rawVoltage = this._parsedProps.voltageRating

    const current =
      typeof rawCurrent === "string" ? parseFloat(rawCurrent) : rawCurrent

    const voltage =
      typeof rawVoltage === "string" ? parseFloat(rawVoltage) : rawVoltage

    return `${formatSiUnit(current)}A / ${formatSiUnit(voltage)}V`
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const currentRating =
      typeof props.currentRating === "string"
        ? parseFloat(props.currentRating)
        : props.currentRating

    const voltageRating =
      typeof props.voltageRating === "string"
        ? parseFloat(props.voltageRating)
        : props.voltageRating

    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_fuse,
      current_rating_amps: currentRating,
      voltage_rating_volts: voltageRating,
      display_current_rating: `${formatSiUnit(currentRating)}A`,
      display_voltage_rating: `${formatSiUnit(voltageRating)}V`,
      display_name: props.displayName,
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
