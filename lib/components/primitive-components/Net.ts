import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"

export const netProps = z.object({
  name: z.string(),
})

export class Net extends PrimitiveComponent<typeof netProps> {
  get config() {
    return {
      zodProps: netProps,
    }
  }

  getPortSelector() {
    return `net.${this.props.name}`
  }

  doInitialCreateNetsFromProps() {
    // This method is intentionally left empty as Net is already a net
  }
}
