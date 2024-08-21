import type { PCBSMTPad } from "@tscircuit/soup"
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

  matchedComponents: PrimitiveComponent[]

  constructor(props: z.input<typeof portProps>) {
    if (!props.name && props.pinNumber) props.name = `pin${props.pinNumber}`
    if (!props.name) {
      throw new Error("Port must have a name or a pinNumber")
    }
    super(props)
    this.matchedComponents = []
  }

  /**
   * Smtpads and platedholes call this method to register themselves as a match
   * for this port. All the matching is done by primitives other than the Port,
   * but everyone registers themselves as a match with their Port.
   */
  registerMatch(component: PrimitiveComponent) {
    this.matchedComponents.push(component)
  }
  getAllPortAliases() {
    const { _parsedProps: props } = this
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
  isMatchingPort(port: Port) {
    return this.doesMatchAnyAlias(port.getAllPortAliases())
  }
  getPortSelector() {
    return `.${this.parent?.props.name} > port.${this.props.name}`
    // return `#${this.props.id}`
  }

  doInitialSourceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props } = this

    const port_hints = this.getAllPortAliases()

    const source_port = db.source_port.insert({
      name: props.name!,
      pin_number: props.pinNumber,
      port_hints,
      source_component_id: this.parent?.source_component_id!,
    })

    this.source_port_id = source_port.source_port_id
  }

  doInitialSourceParentAttachment(): void {
    const { db } = this.project!
    if (!this.parent?.source_component_id) {
      throw new Error(
        `${this.getString()} has no parent source component (parent: ${this.parent?.getString()})`,
      )
    }

    db.source_port.update(this.source_port_id!, {
      source_component_id: this.parent?.source_component_id!,
    })

    this.source_component_id = this.parent?.source_component_id
  }

  /**
   * For PcbPorts, we use the parent attachment phase to determine where to place
   * the pcb_port (prior to this phase, the smtpad/platedhole isn't guaranteed
   * to exist)
   */
  doInitialPcbPortRender(): void {
    const { db } = this.project!
    const { matchedComponents } = this

    if (!this.parent?.pcb_component_id) {
      throw new Error(
        `${this.getString()} has no parent pcb component, cannot render pcb_port (parent: ${this.parent?.getString()})`,
      )
    }

    const pcbMatches = matchedComponents.filter((c) => c.isPcbPrimitive)

    if (pcbMatches.length === 0) return

    if (pcbMatches.length > 1) {
      throw new Error(
        `${this.getString()} has multiple pcb matches, unclear how to place pcb_port: ${pcbMatches.map((c) => c.getString()).join(", ")}`,
      )
    }

    const pcbMatch: any = pcbMatches[0]

    if ("getPortPosition" in pcbMatch) {
      const pcb_port = db.pcb_port.insert({
        pcb_component_id: this.parent?.pcb_component_id!,
        layers: ["top"],

        ...pcbMatch.getPortPosition(),

        source_port_id: this.source_component_id!,
      })
      this.pcb_port_id = pcb_port.pcb_port_id
    } else {
      throw new Error(
        `${pcbMatch.getString()} does not have a getPortPosition method (needed for pcb_port placement)`,
      )
    }
  }
}
