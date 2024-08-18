import { BaseComponent } from "./BaseComponent"
import { z } from "zod"

export const netProps = z.object({
  name: z.string(),
})

export class Net extends BaseComponent<typeof netProps> {
  getPortSelector() {
    return `net.${this.props.name}`
  }
}
