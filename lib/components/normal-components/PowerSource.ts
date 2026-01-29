import { powerSourceProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"

export class PowerSource extends NormalComponent<
  typeof powerSourceProps,
  PolarizedPassivePorts
> {
  // @ts-ignore
  get config() {
    return {
      schematicSymbolName: this.props.symbolName ?? "power_factor_meter",
      componentName: "PowerSource",
      zodProps: powerSourceProps,
      sourceFtype: "simple_power_source" as Ftype,
    }
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["positive", "pos", "left"],
        pin2: ["negative", "neg", "right"],
      },
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_power_source",
      name: this.name,
      voltage: props.voltage,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: false,
      display_name: props.displayName,
    } as any)
    this.source_component_id = source_component.source_component_id
  }

  pos = this.portMap.pin1
  positive = this.portMap.pin1
  neg = this.portMap.pin2
  negative = this.portMap.pin2
}
