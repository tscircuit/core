import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"

export const portProps = z.object({
  name: z.string().optional(),
  pinNumber: z.number().optional(),
  aliases: z.array(z.string()).optional(),
})

export type PortProps = z.infer<typeof portProps>

export class Port extends PrimitiveComponent<typeof portProps> {
  source_port_id: string | null = null
  pcb_port_id: string | null = null
  schematic_port_id: string | null = null

  constructor(props: z.input<typeof portProps>) {
    if (!props.name && props.pinNumber) props.name = `pin${props.pinNumber}`
    if (!props.name) {
      throw new Error("Port must have a name or a pinNumber")
    }
    super(props)
    this.initPorts()
  }

  getAllPortAliases() {
    const { props } = this
    return Array.from(
      new Set([
        ...(props.aliases ?? []),
        props.name,
        ...(typeof props.pinNumber === "number"
          ? [`pin${props.pinNumber}`, props.pinNumber.toString()]
          : []),
      ]),
    ) as string[]
  }
  doesMatchName(name: string) {
    return this.getAllPortAliases().includes(name)
  }
  doesMatchAnyAlias(aliases: Array<string | number>) {
    return this.getAllPortAliases().some((a) =>
      aliases.map((a) => a.toString()).includes(a),
    )
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

    const port_hints = this.getAllPortAliases()

    const source_port = db.source_port.insert({
      name: props.name!,
      pin_number: props.pinNumber,
      port_hints,
      source_component_id: this.parent?.source_component_id!,
    })

    this.source_port_id = source_port.source_port_id
  }

  doInitialPcbComponentRender(): void {
    const { db } = this.project!
    if (!this.parent?.pcb_component_id) {
      db.pcb_error.insert({
        // @ts-ignore
        error_type: "pcb_component_missing_for_port",
        message: `${this.getString()} has no parent pcb component`,
      })
      return
    }
    const { props } = this
    const pcb_port = db.pcb_port.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layers: ["top"],

      // The position of a port is set by the parent, we just set to 0 initially
      x: 0,
      y: 0,

      source_port_id: this.source_component_id!,
    })
    this.pcb_port_id = pcb_port.pcb_port_id
  }
}
