import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"

export const netProps = z.object({
  name: z.string(),
})

export class Net extends PrimitiveComponent<typeof netProps> {
  getPortSelector() {
    return `net.${this.props.name}`
  }
}
