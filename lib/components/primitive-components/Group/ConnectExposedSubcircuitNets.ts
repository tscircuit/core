import type { SourceNet } from "circuit-json"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { z } from "zod"
import type { Group } from "./Group"

export const normalizeExposedNetName = (netName: string) =>
  netName.startsWith("net.") ? netName.slice("net.".length) : netName

export const connectExposedSubcircuitNetsProps = z.object({
  netName: z.string(),
  childSubcircuit: z.any(),
})

export class ConnectExposedSubcircuitNets extends PrimitiveComponent<
  typeof connectExposedSubcircuitNetsProps
> {
  source_trace_id: string | null = null

  get config() {
    return {
      componentName: "ConnectExposedSubcircuitNets",
      zodProps: connectExposedSubcircuitNetsProps,
    }
  }

  private _getSourceNet(
    subcircuitId: string | null | undefined,
  ): SourceNet | undefined {
    if (!subcircuitId) return undefined
    const { db } = this.root!
    return db.source_net
      .list()
      .find(
        (net) =>
          net.subcircuit_id === subcircuitId &&
          net.name === this._parsedProps.netName,
      )
  }

  doInitialConnectExposedSubcircuitNets(): void {
    const childSubcircuit = this._parsedProps.childSubcircuit as Group<any>
    const parentSubcircuit = childSubcircuit.parent?.getSubcircuit?.()
    const parentSubcircuitId = parentSubcircuit?.subcircuit_id
    const childSubcircuitId = childSubcircuit.subcircuit_id

    if (!parentSubcircuitId || !childSubcircuitId) return
    if (parentSubcircuitId === childSubcircuitId) return

    const childNet = this._getSourceNet(childSubcircuitId)
    const parentNet = this._getSourceNet(parentSubcircuitId)
    if (!childNet || !parentNet) return

    const { db } = this.root!
    const connectedNetIds = [
      childNet.source_net_id,
      parentNet.source_net_id,
    ].sort()

    const existingTrace = db.source_trace.list().find((trace) => {
      if (trace.connected_source_port_ids.length > 0) return false
      if (trace.connected_source_net_ids.length !== connectedNetIds.length) {
        return false
      }
      return (
        [...trace.connected_source_net_ids].sort().join(",") ===
        connectedNetIds.join(",")
      )
    })

    if (existingTrace) {
      this.source_trace_id = existingTrace.source_trace_id
      return
    }

    const sourceTrace = db.source_trace.insert({
      connected_source_port_ids: [],
      connected_source_net_ids: connectedNetIds,
      subcircuit_id: parentSubcircuitId,
      name: `exposed_net.${this._parsedProps.netName}`,
      display_name: this._parsedProps.netName,
    })
    this.source_trace_id = sourceTrace.source_trace_id
  }
}
