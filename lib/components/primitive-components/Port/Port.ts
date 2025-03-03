import { getRelativeDirection } from "lib/utils/get-relative-direction"
import type {
  SchematicBoxDimensions,
  SchematicBoxPortPositionWithMetadata,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { type SchSymbol } from "schematic-symbols"
import { applyToPoint, compose, translate } from "transformation-matrix"
import { z } from "zod"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Trace } from "../Trace/Trace"
import type { LayerRef } from "circuit-json"
import { areAllPcbPrimitivesOverlapping } from "./areAllPcbPrimitivesOverlapping"
import { getCenterOfPcbPrimitives } from "./getCenterOfPcbPrimitives"
import type { INormalComponent } from "lib/components/base-components/NormalComponent/INormalComponent"

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

  originDescription: string | null = null

  get config() {
    return {
      componentName: "Port",
      zodProps: portProps,
    }
  }

  constructor(
    props: z.input<typeof portProps>,
    opts: { originDescription?: string } = {},
  ) {
    if (!props.name && props.pinNumber !== undefined)
      props.name = `pin${props.pinNumber}`
    if (!props.name) {
      throw new Error("Port must have a name or a pinNumber")
    }
    super(props)
    if (opts.originDescription) {
      this.originDescription = opts.originDescription
    }
    this.matchedComponents = []
  }

  _getGlobalPcbPositionBeforeLayout(): { x: number; y: number } {
    const matchedPcbElm = this.matchedComponents.find((c) => c.isPcbPrimitive)
    const parentComponent = this.parent

    // First check if parent component has a footprint
    if (parentComponent && !parentComponent.props.footprint) {
      throw new Error(
        `${parentComponent.componentName} "${parentComponent.props.name}" does not have a footprint. Add a footprint prop, e.g. <${parentComponent.componentName.toLowerCase()} footprint="..." />`,
      )
    }

    if (!matchedPcbElm) {
      throw new Error(
        `Port ${this} has no matching PCB primitives. This often means the footprint's pads lack matching port hints.`,
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

  _getPortsInternallyConnectedToThisPort(): Port[] {
    const parent = this.parent as unknown as INormalComponent | undefined
    if (!parent || !parent._getInternallyConnectedPins) return []
    const internallyConnectedPorts = parent._getInternallyConnectedPins()
    for (const ports of internallyConnectedPorts) {
      if (ports.some((port) => port === this)) {
        return ports
      }
    }
    return []
  }

  /**
   * Return true if this port has a schematic representation and can be rendered
   * to the schematic.
   *
   * Sometimes things like mounting holes don't have a schematic representation
   * and aren't rendered to the schematic.
   *
   * It's common for a schematic symbol to not have a representation for all of
   * the pins on a footprint, e.g. a pushbutton has 4 pins but is typically
   * represented by a two-pin symbol. In these cases, it's best to use
   * internallyConnectedPorts or externallyConnectedPorts to ensure the things
   * are rendered properly.
   */
  _hasSchematicPort() {
    const symbol = this.parent?.getSchematicSymbol()
    if (symbol) {
      if (this.schematicSymbolPortDef) return true

      const portsInternallyConnectedToThisPort =
        this._getPortsInternallyConnectedToThisPort()

      if (
        portsInternallyConnectedToThisPort.some((p) => p.schematicSymbolPortDef)
      )
        return true

      return false
    }

    const parentBoxDim = this?.parent?._getSchematicBoxDimensions()
    if (parentBoxDim && this.props.pinNumber !== undefined) {
      const localPortPosition = parentBoxDim.getPortPositionByPinNumber(
        this.props.pinNumber!,
      )
      if (localPortPosition) return true
    }

    return false
  }

  _getGlobalSchematicPositionBeforeLayout(): { x: number; y: number } {
    const symbol = this.parent?.getSchematicSymbol()
    if (symbol) {
      let schematicSymbolPortDef = this.schematicSymbolPortDef

      if (!schematicSymbolPortDef) {
        schematicSymbolPortDef =
          this._getPortsInternallyConnectedToThisPort().find(
            (p) => p.schematicSymbolPortDef,
          )?.schematicSymbolPortDef ?? null
        if (!schematicSymbolPortDef) {
          throw new Error(
            `Couldn't find schematicSymbolPortDef for port ${this.getString()}, searched internally connected ports and none had a schematicSymbolPortDef. Why are we trying to get the schematic position of this port?`,
          )
        }
      }

      const transform = compose(
        this.parent!.computeSchematicGlobalTransform(),
        translate(-symbol.center.x, -symbol.center.y),
      )

      return applyToPoint(transform, schematicSymbolPortDef!)
    }

    const parentBoxDim = this?.parent?._getSchematicBoxDimensions()
    if (parentBoxDim && this.props.pinNumber !== undefined) {
      const localPortPosition = parentBoxDim.getPortPositionByPinNumber(
        this.props.pinNumber!,
      )
      if (!localPortPosition) {
        throw new Error(
          `Couldn't find position for schematic_port for port ${this.getString()} inside of the schematic box`,
        )
      }
      return applyToPoint(
        this.parent!.computeSchematicGlobalTransform(),
        localPortPosition,
      )
    }

    throw new Error(
      `Couldn't find position for schematic_port for port ${this.getString()}`,
    )
  }

  _getGlobalSchematicPositionAfterLayout(): { x: number; y: number } {
    const { db } = this.root!
    if (!this.schematic_port_id) {
      throw new Error(
        `Can't get schematic port position after layout, no schematic_port_id`,
      )
    }
    const schematic_port = db.schematic_port.get(this.schematic_port_id)!
    if (!schematic_port)
      throw new Error(
        `Schematic port not found when trying to get post-layout position: ${this.schematic_port_id}`,
      )
    return schematic_port.center
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
        ...(props.name ? [props.name] : []),
        ...(typeof props.pinNumber === "number"
          ? [`pin${props.pinNumber}`, props.pinNumber.toString()]
          : []),
        ...(this.externallyAddedAliases ?? []),
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
  getAvailablePcbLayers(): LayerRef[] {
    return Array.from(
      new Set(this.matchedComponents.flatMap((c) => c.getAvailablePcbLayers())),
    ) as LayerRef[]
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
      subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
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
      subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
    })

    this.source_component_id = this.parent?.source_component_id
  }

  doInitialPcbPortRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { matchedComponents } = this

    if (!this.parent?.pcb_component_id) {
      throw new Error(
        `${this.getString()} has no parent pcb component, cannot render pcb_port (parent: ${this.parent?.getString()})`,
      )
    }

    const pcbMatches = matchedComponents.filter((c) => c.isPcbPrimitive)

    if (pcbMatches.length === 0) return

    let matchCenter: { x: number; y: number } | null = null

    if (pcbMatches.length === 1) {
      matchCenter = pcbMatches[0]._getPcbCircuitJsonBounds().center
    }

    if (pcbMatches.length > 1) {
      if (!areAllPcbPrimitivesOverlapping(pcbMatches)) {
        throw new Error(
          `${this.getString()} has multiple non-overlapping pcb matches, unclear how to place pcb_port: ${pcbMatches.map((c) => c.getString()).join(", ")}. (Note: tscircuit core does not currently allow you to specify internally connected pcb primitives with the same port hints, try giving them different port hints and specifying they are connected externally- or file an issue)`,
        )
      }

      matchCenter = getCenterOfPcbPrimitives(pcbMatches)
    }

    if (matchCenter) {
      const subcircuit = this.getSubcircuit()

      const pcb_port = db.pcb_port.insert({
        pcb_component_id: this.parent?.pcb_component_id!,
        layers: this.getAvailablePcbLayers(),
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        ...matchCenter,

        source_port_id: this.source_port_id!,
      })
      this.pcb_port_id = pcb_port.pcb_port_id
    } else {
      const pcbMatch: any = pcbMatches[0]
      throw new Error(
        `${pcbMatch.getString()} does not have a center or _getGlobalPcbPositionBeforeLayout method (needed for pcb_port placement)`,
      )
    }
  }

  doInitialSchematicPortRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const container = this.getPrimitiveContainer()

    if (!container) return
    if (!this._hasSchematicPort()) return

    const containerCenter = container._getGlobalSchematicPositionBeforeLayout()
    const portCenter = this._getGlobalSchematicPositionBeforeLayout()

    let localPortInfo: SchematicBoxPortPositionWithMetadata | null = null
    const containerDims = container._getSchematicBoxDimensions()
    if (containerDims && props.pinNumber !== undefined) {
      localPortInfo = containerDims.getPortPositionByPinNumber(props.pinNumber)
    }

    // For each obstacle, create a schematic_debug_object
    if (this.getSubcircuit().props._schDebugObjectsEnabled) {
      db.schematic_debug_object.insert({
        shape: "rect",
        center: portCenter,
        size: {
          width: 0.1,
          height: 0.1,
        },
        label: "obstacle",
      } as any) // TODO issue with discriminated union
    }

    if (!localPortInfo?.side) {
      this.facingDirection = getRelativeDirection(containerCenter, portCenter)
    } else {
      this.facingDirection = {
        left: "left",
        right: "right",
        top: "up",
        bottom: "down",
      }[localPortInfo.side] as "up" | "down" | "left" | "right"
    }

    const sourcePort = db.source_port.get(this.source_port_id!)

    let bestDisplayPinLabel: string | undefined = undefined
    for (const portHint of sourcePort?.port_hints ?? []) {
      if (portHint.match(/^(pin)?\d+$/)) continue
      bestDisplayPinLabel = portHint
    }

    const schematic_port = db.schematic_port.insert({
      schematic_component_id: this.parent?.schematic_component_id!,
      center: portCenter,
      source_port_id: this.source_port_id!,
      facing_direction: this.facingDirection,
      distance_from_component_edge: 0.4,
      side_of_component: localPortInfo?.side,
      pin_number: props.pinNumber,
      true_ccw_index: localPortInfo?.trueIndex,
      display_pin_label: bestDisplayPinLabel,
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

  _hasMatchedPcbPrimitive() {
    return this.matchedComponents.some((c) => c.isPcbPrimitive)
  }
}
