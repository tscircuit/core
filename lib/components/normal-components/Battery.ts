import { batteryProps } from "@tscircuit/props"
import type { SourceSimpleBatteryInput } from "circuit-json"

import type { BaseSymbolName, Ftype, PassivePorts } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
export class Battery extends NormalComponent<
  typeof batteryProps,
  PassivePorts
> {
  get config() {
    return {
      componentName: "Battery",
      schematicSymbolName: (this.props.symbolName ??
        ("battery" as BaseSymbolName)) as BaseSymbolName,
      zodProps: batteryProps,
      sourceFtype: "simple_power_source" as Ftype,
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
      name: this.name,
      ftype: "simple_power_source" as Ftype,
      capacity: props.capacity,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: false,
      display_name: props.displayName,
    } as SourceSimpleBatteryInput)
    this.source_component_id = source_component.source_component_id
  }
}
