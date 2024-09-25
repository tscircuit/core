import { capacitorProps, ledProps } from "@tscircuit/props"
import { FTYPE, SYMBOL } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import type { capacitance, SourceSimpleCapacitorInput } from "circuit-json"
import { Trace } from "../primitive-components/Trace"

type PortNames =
  | "1"
  | "2"
  | "pin1"
  | "pin2"
  | "left"
  | "right"
  | "anode"
  | "cathode"

export class Capacitor extends NormalComponent<
  typeof capacitorProps,
  PortNames
> {
  get config() {
    return {
      // schematicSymbolName: BASE_SYMBOLS.capacitor,
      zodProps: ledProps,
      sourceFtype: FTYPE.simple_capacitor,
    }
  }

  componentName = "Capacitor"

  pin1 = this.portMap.pin1
  pin2 = this.portMap.pin2

  doInitialCreateNetsFromProps() {
    this._createNetsFromProps([
      this.props.decouplingFor,
      this.props.decouplingTo,
    ])
  }

  doInitialCreateTracesFromProps() {
    if (this.props.decouplingFor && this.props.decouplingTo) {
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.1`,
          to: this.props.decouplingFor,
        }),
      )
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.2`,
          to: this.props.decouplingTo,
        }),
      )
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_capacitor",
      name: props.name,
      // @ts-ignore
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,

      capacitance: props.capacitance,
    } as SourceSimpleCapacitorInput)
    this.source_component_id = source_component.source_component_id
  }
}
