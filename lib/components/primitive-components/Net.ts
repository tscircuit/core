import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"
import type { Port } from "./Port"

export const netProps = z.object({
  name: z.string(),
})

export class Net extends PrimitiveComponent<typeof netProps> {
  source_net_id?: string

  getPortSelector() {
    return `net.${this.props.name}`
  }

  doInitialSourceComponentRender(): void {
    const { db } = this.project!
    const { _parsedProps: props } = this

    const net = db.source_net.insert({
      name: props.name,
      member_source_group_ids: [],
    })

    this.source_net_id = net.source_net_id
  }

  getAllConnectedPorts(): Port[] {
    const allPorts = this.getSubcircuit().selectAll("port") as Port[]
    const connectedPorts: Port[] = []

    for (const port of allPorts) {
      const traces = port._getExplicitlyConnectedTraces()

      for (const trace of traces) {
        if (trace._isExplicitlyConnectedToNet(this)) {
          connectedPorts.push(port)
          break
        }
      }
    }

    return connectedPorts
  }
}
