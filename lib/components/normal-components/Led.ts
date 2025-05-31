import { ledProps } from "@tscircuit/props"
import type {
  BaseSymbolName,
  Ftype,
  PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

export class Led extends NormalComponent<
  typeof ledProps,
  PolarizedPassivePorts
> {
  // @ts-ignore
  get config() {
    return {
      componentName: "Led",
      schematicSymbolName: this.props.symbolName ?? ("led" as BaseSymbolName),
      zodProps: ledProps,
      sourceFtype: "simple_led" as Ftype,
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

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_led",
      name: props.name,
      wave_length: props.wavelength,
      color: props.color,
      // @ts-ignore
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: false,
    } as any)
    this.source_component_id = source_component.source_component_id
  }

  pos = this.portMap.pin1
  anode = this.portMap.pin1
  neg = this.portMap.pin2
  cathode = this.portMap.pin2
}
