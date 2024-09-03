import { resistorProps } from "@tscircuit/props"
import type { PassivePorts, Ftype, BaseSymbolName } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import type { SourceSimpleResistorInput } from "@tscircuit/soup"
import { z } from "zod"
import { Trace } from "../primitive-components/Trace"
import { Net } from "../primitive-components/Net"

export class Resistor extends NormalComponent<
  typeof resistorProps,
  PassivePorts
> {
  get config() {
    return {
      schematicSymbolName: "boxresistor" as BaseSymbolName,
      zodProps: resistorProps,
      sourceFtype: "simple_resistor" as Ftype,
    }
  }

  pin1 = this.portMap.pin1
  pin2 = this.portMap.pin2

  // doInitialCreateNetsFromProps() {
  //   const propsWithConnections = [this.props.pullupFor, this.props.pullupTo]
  //   for (const prop of propsWithConnections) {
  //     if (typeof prop === "string" && prop.startsWith("net.")) {
  //       this.getOpaqueGroup().add(
  //         new Net({
  //           name: prop.split(".")[1],
  //         }),
  //       )
  //     }
  //   }
  // }

  doInitialCreateTracesFromProps() {
    if (this.props.pullupFor && this.props.pullupTo) {
      this.add(
        new Trace({
          from: `${this.getOpaqueGroupSelector()} > port.1`,
          to: this.props.pullupFor,
        }),
      )
      this.add(
        new Trace({
          from: `${this.getOpaqueGroupSelector()} > port.2`,
          to: this.props.pullupTo,
        }),
      )
    }
  }

  doInitialSourceRender() {
    const { db } = this.project!
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
