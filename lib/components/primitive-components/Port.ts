import type { PCBSMTPad } from "@tscircuit/soup"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { symbols, type SchSymbol } from "schematic-symbols"
import { applyToPoint, compose, translate } from "transformation-matrix"
import type { Trace } from "./Trace"

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

  schematicSymbolPortDef: SchSymbol["ports"][number] | null = null
  matchedComponents: PrimitiveComponent[]
  facingDirection: "up" | "down" | "left" | "right" | null = null

  constructor(props: z.input<typeof portProps>) {
    if (!props.name && props.pinNumber) props.name = `pin${props.pinNumber}`
    if (!props.name) {
      throw new Error("Port must have a name or a pinNumber")
    }
    super(props)
    this.matchedComponents = []
  }

  _getGlobalPcbPositionBeforeLayout(): { x: number; y: number } {
    const matchedPcbElm = this.matchedComponents.find((c) => c.isPcbPrimitive)

    if (!matchedPcbElm) {
      throw new Error(
        `Port ${this} has no matched pcb component, can't get global schematic position`,
      )
    }

    return matchedPcbElm?._getGlobalPcbPositionBeforeLayout() ?? { x: 0, y: 0 }
  }

  _getPcbCircuitJsonBounds() {
    if (!this.pcb_port_id) {
      return super._getPcbCircuitJsonBounds()
    }
    const { db } = this.root!
    const pcb_port = db.pcb_port.get(this.pcb_port_id)!
    return {
      center: { x: pcb_port.x, y: pcb_port.y },
      bounds: { left: 0, top: 0, right: 0, bottom: 0 },
      width: 0,
      height: 0,
    }
  }

  _getGlobalPcbPositionAfterLayout(): { x: number; y: number } {
    return this._getPcbCircuitJsonBounds().center
  }

  _getGlobalSchematicPositionBeforeLayout(): { x: number; y: number } {
    if (!this.schematicSymbolPortDef) {
      return applyToPoint(this.parent!.computeSchematicGlobalTransform(), {
        x: 0,
        y: 0,
      })
      throw new Error(
        `Could not find schematic symbol port for port ${this} so couldn't determine port position`,
      )
    }

    const symbol = this.parent?.getSchematicSymbol()
    if (!symbol) throw new Error(`Could not find parent symbol for ${this}`)

    const transform = compose(
      this.parent!.computeSchematicGlobalTransform(),
      translate(-symbol.center.x, -symbol.center.y),
    )

    return applyToPoint(transform, this.schematicSymbolPortDef)
  }

  /**
   * Smtpads and platedholes call this method to register themselves as a match
   * for this port. All the matching is done by primitives other than the Port,
   * but everyone registers themselves as a match with their Port.
   */
  registerMatch(component: PrimitiveComponent) {
    this.matchedComponents.push(component)
  }
  getNameAndAliases() {
    const { _parsedProps: props } = this
    return Array.from(
      new Set([
        ...(props.aliases ?? []),
        props.name,
        ...(typeof props.pinNumber === "number"
          ? [`pin${props.pinNumber}`, props.pinNumber.toString()]
          : []),
        ...this.externallyAddedAliases,
      ]),
    ) as string[]
  }
  isMatchingPort(port: Port) {
    return this.isMatchingAnyOf(port.getNameAndAliases())
  }
  getPortSelector() {
    // TODO this.parent.getSubcircuitSelector() >
    return `.${this.parent?.props.name} > port.${this.props.name}`
  }
  getAvailablePcbLayers(): string[] {
    return Array.from(
      new Set(this.matchedComponents.flatMap((c) => c.getAvailablePcbLayers())),
    )
  }

  /**
   * Return traces that are explicitly connected to this port (not via a net)
   */
  _getDirectlyConnectedTraces(): Trace[] {
    const allSubcircuitTraces = this.getSubcircuit().selectAll(
      "trace",
    ) as Trace[]

    const connectedTraces = allSubcircuitTraces.filter((trace) =>
      trace._isExplicitlyConnectedToPort(this),
    )

    return connectedTraces
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const port_hints = this.getNameAndAliases()

    const source_port = db.source_port.insert({
      name: props.name!,
      pin_number: props.pinNumber,
      port_hints,
      source_component_id: this.parent?.source_component_id!,
    })

    this.source_port_id = source_port.source_port_id
  }

  doInitialSourceParentAttachment(): void {
    const { db } = this.root!
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

  doInitialPcbPortRender(): void {
    const { db } = this.root!
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

    if ("_getPcbCircuitJsonBounds" in pcbMatch) {
      const pcb_port = db.pcb_port.insert({
        pcb_component_id: this.parent?.pcb_component_id!,
        layers: this.getAvailablePcbLayers(),

        ...pcbMatch._getPcbCircuitJsonBounds().center,

        source_port_id: this.source_port_id!,
      })
      this.pcb_port_id = pcb_port.pcb_port_id
    } else {
      throw new Error(
        `${pcbMatch.getString()} does not have a _getGlobalPcbPositionBeforeLayout method (needed for pcb_port placement)`,
      )
    }
  }

  doInitialSchematicPortRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    if (!this.parent) return

    const center = this._getGlobalSchematicPositionBeforeLayout()
    const parentCenter = this.parent?._getGlobalSchematicPositionBeforeLayout()

    this.facingDirection = getRelativeDirection(parentCenter, center)

    const schematic_port = db.schematic_port.insert({
      schematic_component_id: this.parent?.schematic_component_id!,
      center,
      source_port_id: this.source_port_id!,
      facing_direction: this.facingDirection,
    })

    this.schematic_port_id = schematic_port.schematic_port_id
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }): void {
    const { db } = this.root!
    if (!this.pcb_port_id) return

    db.pcb_port.update(this.pcb_port_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })
  }
}
