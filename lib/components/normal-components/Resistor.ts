import { resistorProps } from "@tscircuit/props"
import type { SourceSimpleResistorInput } from "@tscircuit/soup"
import type { BaseSymbolName, Ftype, PassivePorts } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace/Trace"
import { formatSiUnit } from "format-si-unit"

export class Resistor extends NormalComponent<
  typeof resistorProps,
  PassivePorts
> {
  get config() {
    return {
      componentName: "Resistor",
      schematicSymbolName: this.props.symbolName ?? "boxresistor",
      zodProps: resistorProps,
      sourceFtype: "simple_resistor" as Ftype,
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
    // Handle both string and number formats, ensure Ω symbol
    const res = this.props.resistance
    return typeof res === "string" ? `${res}Ω` : `${formatSiUnit(res)}Ω`
  }

  doInitialCreateNetsFromProps() {
    this._createNetsFromProps([this.props.pullupFor, this.props.pullupTo])
  }

  doInitialCreateTracesFromProps() {
    if (this.props.pullupFor && this.props.pullupTo) {
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.1`,
          to: this.props.pullupFor,
        }),
      )
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.2`,
          to: this.props.pullupTo,
        }),
      )
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_resistor",
      name: props.name,
      display_value: this._getSchematicSymbolDisplayValue(),
      resistance: props.resistance,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
