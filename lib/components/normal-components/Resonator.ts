import { resonatorProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"
import { SourceSimpleResonator } from "circuit-json"
import type { SchematicPortArrangement } from "@tscircuit/props"

export class Resonator extends NormalComponent<typeof resonatorProps> {
  get config() {
    return {
      componentName: "Resonator",
      zodProps: resonatorProps, // Using resonatorProps for validation
      shouldRenderAsSchematicBox: true,
    }
  }

  _getImpliedFootprintString(): string | null {
    const frequency = this._parsedProps.frequency
    const loadCapacitance = this._parsedProps.loadCapacitance
    if (frequency && loadCapacitance) {
      return `resonator_3pin_f${frequency}_cl${loadCapacitance}`
    }
    return null
  }

  initPorts() {
    const pinCount = 3 // Fixed for 3-pin resonator
    for (let i = 1; i <= pinCount; i++) {
      this.add(
        new Port({
          name: `pin${i}`,
          pinNumber: i,
          aliases: [],
        }),
      )
    }
  }

  _getSchematicPortArrangement(): SchematicPortArrangement | null {
    const pinCount = 3 // Fixed for 3-pin resonator
    return {
      leftSize: 1,
      rightSize: 2,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "resonator",
      name: props.name,
      frequency: props.frequency,
      load_capacitance: props.loadCapacitance,
      pin_count: 3,
      supplier_part_numbers: props.supplierPartNumbers,
      gender: props.gender,
    } as SourceSimpleResonator) // Cast to SourceSimpleResonator type
    this.source_component_id = source_component.source_component_id
  }
}
