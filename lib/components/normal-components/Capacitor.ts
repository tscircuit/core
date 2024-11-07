import { capacitorProps } from "@tscircuit/props"
import type { SourceSimpleCapacitorInput } from "@tscircuit/soup"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace"
import { formatSiUnit } from "format-si-unit"

export class Capacitor extends NormalComponent<
  typeof capacitorProps,
  PassivePorts
> {
  // @ts-ignore (cause the symbolName is string and not fixed)
  get config() {
    return {
      componentName: "Capacitor",
      schematicSymbolName:
        this.props.symbolName ?? ("capacitor_horz" as BaseSymbolName),
      zodProps: capacitorProps,
      sourceFtype: FTYPE.simple_capacitor,
    }
  }

  initPorts() {
    this.add(
      new Port({
        name: "pin1",
        pinNumber: 1,
        aliases: ["anode", "pos", "left"],
      }),
    )
    this.add(
      new Port({
        name: "pin2",
        pinNumber: 2,
        aliases: ["cathode", "neg", "right"],
      }),
    )
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.capacitance)}F`
  }

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
