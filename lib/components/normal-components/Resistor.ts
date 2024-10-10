import { resistorProps } from "@tscircuit/props"
import type { SourceSimpleResistorInput } from "@tscircuit/soup"
import type { BaseSymbolName, Ftype, PassivePorts } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace"

export class Resistor extends NormalComponent<
  typeof resistorProps,
  PassivePorts
> {
  // @ts-ignore (cause the symbolName is string and not fixed)
  get config() {
    return {
      componentName: "Resistor",
      schematicSymbolName:
        this.props.symbolName ?? ("boxresistor_horz" as BaseSymbolName),
      zodProps: resistorProps,
      sourceFtype: "simple_resistor" as Ftype,
    }
  }


  initPorts() {
    this.add(new Port({ name: "pin1", pinNumber: 1, aliases: ["anode", "pos", "left"] }))
    this.add(new Port({ name: "pin2", pinNumber: 2, aliases: ["cathode", "neg", "right"] }))
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
      // @ts-ignore
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,

      resistance: props.resistance,
    } as SourceSimpleResistorInput)
    this.source_component_id = source_component.source_component_id
  }
}
