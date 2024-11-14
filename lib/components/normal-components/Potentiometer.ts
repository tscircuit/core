import { potentiometerProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import type { SourceSimplePotentiometer } from "circuit-json"
import { formatSiUnit } from "format-si-unit"

export class Potentiometer extends NormalComponent<
  typeof potentiometerProps,
  PolarizedPassivePorts
> {
  // @ts-ignore
  get config() {
    return {
      schematicSymbolName: this.props.symbolName ?? ("potentiometer2" as BaseSymbolName),
      componentName: "Potentiometer",
      zodProps: potentiometerProps,
      sourceFtype: "simple_potentiometer" as Ftype,
    }
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.maxResistance)}Ω`
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: props.name,
      ftype: "simple_potentiometer",
      max_resistance: props.maxResistance,
    } as SourceSimplePotentiometer)
    this.source_component_id = source_component.source_component_id
  }
}
