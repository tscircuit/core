import { interconnectProps } from "@tscircuit/props"
import type { Ftype } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { Port } from "../primitive-components/Port"

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

    const source_component = db.source_component.insert({
      ftype: "interconnect" as Ftype,
      name: this.name,
      are_pins_interchangeable: true,
    })

    this.source_component_id = source_component.source_component_id
  }

  /**
   * After ports have their source_component_id assigned, create the
   * source_component_internal_connection to indicate which pins are
   * internally connected (for 0-ohm jumper behavior).
   */
  doInitialSourceParentAttachment(): void {
    const { db } = this.root!

    const internallyConnectedPorts = this._getInternallyConnectedPins()

    for (const ports of internallyConnectedPorts) {
      const sourcePortIds = ports
        .map((port: Port) => port.source_port_id)
        .filter((id): id is string => id !== null)

      if (sourcePortIds.length >= 2) {
        db.source_component_internal_connection.insert({
          source_component_id: this.source_component_id!,
          // in the source_component_internal_connection schema
          // @ts-expect-error uncomment when circuit-json includes subcircuit_id
          subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
          source_port_ids: sourcePortIds,
        })
      }
    }
  }
}
