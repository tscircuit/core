import { interconnectProps } from "@tscircuit/props"
import type { Ftype } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

const INTERCONNECT_STANDARD_FOOTPRINTS: Record<string, string> = {
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

  _getImpliedFootprintString(): string | null {
    const { standard } = this._parsedProps
    if (!standard) return null

    return INTERCONNECT_STANDARD_FOOTPRINTS[standard] ?? null
  }

  doInitialSourceRender() {
    const { db } = this.root!

    const source_component = db.source_component.insert({
      ftype: "interconnect" as Ftype,
      name: this.name,
      are_pins_interchangeable: true,
    })

    this.source_component_id = source_component.source_component_id
  }
}
