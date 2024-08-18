import { BaseComponent } from "./BaseComponent"
import { z } from "zod"

export const portProps = z.object({
  name: z.string(),
  aliases: z.array(z.string()),
})

export type PortProps = z.infer<typeof portProps>

export class Port extends BaseComponent {
  doesMatchName(name: string) {
    return this.props.name === name || this.props.aliases.includes(name)
  }
  getPortSelector() {
    return `${this.parent?.props.name} > port.${this.props.name}`
    // return `#${this.props.id}`
  }
}
