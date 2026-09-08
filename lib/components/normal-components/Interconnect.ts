import { interconnectProps } from "@tscircuit/props"
import type { Ftype } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

const INTERCONNECT_STANDARD_FOOTPRINTS: Record<string, string> = {
  "0402": "0402",
  "0603": "0603",
  "0805": "0805",
  "1206": "1206",
}

export class Interconnect extends NormalComponent<typeof interconnectProps> {
  get config() {
    return {
      componentName: "Interconnect",
      zodProps: interconnectProps,
      shouldRenderAsSchematicBox: true,
      sourceFtype: "interconnect" as Ftype,
    }
  }

  /**
   * For standard footprints (0402, 0603, 0805, 1206), the interconnect acts as
   * a 0-ohm jumper where both pins are internally connected.
   */
  get defaultInternallyConnectedPinNames(): string[][] {
    const { standard } = this._parsedProps
    if (standard && INTERCONNECT_STANDARD_FOOTPRINTS[standard]) {
      return [["pin1", "pin2"]]
    }
    return []
  }

  _getImpliedFootprintString(): string | null {
    const { standard } = this._parsedProps
    if (!standard) return null

    return INTERCONNECT_STANDARD_FOOTPRINTS[standard] ?? null
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "interconnect" as Ftype,
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
      display_name: props.displayName,
    })

    this.source_component_id = source_component.source_component_id
  }
}
