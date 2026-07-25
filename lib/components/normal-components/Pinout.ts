import { pinoutProps } from "@tscircuit/props"
import type { z } from "zod"
import { Chip } from "./Chip"

export class Pinout<PinLabels extends string = never> extends Chip<PinLabels> {
  constructor(props: z.input<typeof pinoutProps>) {
    super(props)
  }

  get config() {
    return {
      ...super.config,
      componentName: "Pinout",
      zodProps: pinoutProps,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_pinout",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
    })

    this.source_component_id = source_component.source_component_id!
  }
}
