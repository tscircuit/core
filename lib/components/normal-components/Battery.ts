import { batteryProps } from "@tscircuit/props"
import type { SourceSimpleBatteryInput } from "circuit-json"

import type { BaseSymbolName, Ftype, PassivePorts } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace/Trace"
import { z } from "zod"

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
      name: props.name,
      ftype: "simple_power_source" as Ftype,
      capacity: props.capacity,
      supplier_part_numbers: props.supplierPartNumbers,
    } as SourceSimpleBatteryInput)
    this.source_component_id = source_component.source_component_id
  }
}
