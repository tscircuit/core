import { BaseComponent } from "./BaseComponent"
import { z } from "zod"

export const portProps = z.object({
  name: z.string(),
  pinNumber: z.number().optional(),
  aliases: z.array(z.string()).optional(),
})

export type PortProps = z.infer<typeof portProps>

export class Port extends BaseComponent<typeof portProps> {
  source_port_id: string | null = null
  pcb_port_id: string | null = null
  schematic_port_id: string | null = null

  doesMatchName(name: string) {
    return this.props.name === name || this.props.aliases.includes(name)
  }
  getPortSelector() {
    return `.${this.parent?.props.name} > port.${this.props.name}`
    // return `#${this.props.id}`
  }

  doInitialSourceRender(): void {
    const { db } = this.project!
    const { props } = this

    if (!this.parent?.source_component_id) {
      throw new Error(`${this.getString()} has no parent source component`)
    }

    const port_hints = [
      ...(props.aliases ?? []),
      props.name,
      ...(typeof props.pinNumber === "number" ? [`pin${props.pinNumber}`] : []),
    ]

    const source_port = db.source_port.insert({
      name: props.name,
      pin_number: props.pinNumber,
      port_hints,
      source_component_id: this.parent?.source_component_id!,
    })

    this.source_port_id = source_port.source_port_id
  }

  doInitialPcbComponentRender(): void {
    const { db } = this.project!
    const { props } = this
    // const pcb_port = db.pcb_port.insert({
    //   name: props.name,
    //   layers: ["top"],
    //   aliases: props.aliases,
    //   source_port_id: this.source_component_id!,
    // })
    // this.pcb_port_id = pcb_port.pcb_port_id
  }
}
