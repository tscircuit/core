import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"

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
}
