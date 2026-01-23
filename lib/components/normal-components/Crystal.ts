import { crystalProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { SourceSimpleCrystal } from "circuit-json"
import { formatSiUnit } from "format-si-unit"

export class Crystal extends NormalComponent<
  typeof crystalProps,
  PolarizedPassivePorts
> {
  // @ts-ignore
  get config() {
    const symbolName =
      this.props.symbolName ??
      ((this.props.pinVariant === "four_pin"
        ? "crystal_4pin"
        : "crystal") as BaseSymbolName)

    return {
      schematicSymbolName: symbolName,
      componentName: "Crystal",
      zodProps: crystalProps,
      sourceFtype: "simple_crystal" as Ftype,
    }
  }

  initPorts() {
    const additionalAliases: Record<`pin${number}`, string[]> =
      this.props.pinVariant === "four_pin"
        ? {
            pin1: ["left1", "1"],
            pin2: ["top1", "2", "gnd1"],
            pin3: ["right1", "3"],
            pin4: ["bottom1", "4", "gnd2"],
          }
        : {
            pin1: ["pos", "left"],
            pin2: ["neg", "right"],
          }

    super.initPorts({
      additionalAliases,
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    const freqDisplay = `${formatSiUnit(this._parsedProps.frequency)}Hz`
    if (this._parsedProps.loadCapacitance) {
      return `${freqDisplay} / ${formatSiUnit(
        this._parsedProps.loadCapacitance,
      )}F`
    }
    return freqDisplay
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: this.name,
      ftype: "simple_crystal",
      frequency: props.frequency,
      load_capacitance: props.loadCapacitance,
      pin_variant: props.pinVariant || "two_pin",
      are_pins_interchangeable: (props.pinVariant || "two_pin") === "two_pin",
      display_name: props.displayName,
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
