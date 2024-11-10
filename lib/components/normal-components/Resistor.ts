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
    // const port1 = this.selectOne<Port>("port.1")!
    // port1.setProps({ aliases: ["anode", "pos", "left"] })

    // console.log("port1", port1.)
    // const port2 = this.selectOne<Port>("port.2")!
    // port2.setProps({ aliases: ["cathode", "neg", "right"] })
    // console.log(
    //   "initPorts",
    //   this.children
    //     .filter((c) => c.lowercaseComponentName === "port")
    //     .map((c) => c.getNameAndAliases()),
    // )
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.resistance)}Ω`
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
