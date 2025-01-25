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
    return {
      schematicSymbolName:
        this.props.symbolName ?? ("crystal" as BaseSymbolName),
      componentName: "Crystal",
      zodProps: crystalProps,
      sourceFtype: "simple_crystal" as Ftype,
    }
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["pos", "left"],
        pin2: ["neg", "right"],
      },
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.frequency)}Hz`
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: props.name,
      ftype: "simple_crystal",
      frequency: props.frequency,
      load_capacitance: props.loadCapacitance,
    } as SourceSimpleCrystal)
    this.source_component_id = source_component.source_component_id
  }
}
