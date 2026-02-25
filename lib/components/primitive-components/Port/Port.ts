import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import type {
  SchematicBoxDimensions,
  SchematicBoxPortPositionWithMetadata,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { type SchSymbol } from "schematic-symbols"
import { applyToPoint, compose, translate } from "transformation-matrix"
import { z } from "zod"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Trace } from "../Trace/Trace"
import type { LayerRef, SchematicPort } from "circuit-json"
import { areAllPcbPrimitivesOverlapping } from "./areAllPcbPrimitivesOverlapping"
import { getCenterOfPcbPrimitives } from "./getCenterOfPcbPrimitives"
import type { PinAttributeMap } from "@tscircuit/props"
import type { INormalComponent } from "lib/components/base-components/NormalComponent/INormalComponent"

export const portProps = z.object({
  name: z.string().optional(),
  pinNumber: z.number().optional(),
  schStemLength: z.number().optional(),
  aliases: z.array(z.string()).optional(),
  layer: z.string().optional(),
  layers: z.array(z.string()).optional(),
  schX: z.number().optional(),
  schY: z.number().optional(),
  direction: z.enum(["up", "down", "left", "right"]).optional(),
  connectsTo: z.union([z.string(), z.array(z.string())]).optional(),
})

export type PortProps = z.infer<typeof portProps>

export class Port extends PrimitiveComponent<typeof portProps> {
  source_port_id: string | null = null
  pcb_port_id: string | null = null
  schematic_port_id: string | null = null
  schematic_stem_line_id: string | null = null

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

  isGroupPort(): boolean {
    return this.parent?.componentName === "Group"
  }

  isComponentPort(): boolean {
    return !this.isGroupPort()
  }

  _getConnectedPortsFromConnectsTo(): Port[] {
    const { _parsedProps: props } = this
    const connectsTo = props.connectsTo
    if (!connectsTo) return []

    const connectedPorts: Port[] = []
    const connectsToArray = Array.isArray(connectsTo)
      ? connectsTo
      : [connectsTo]

    for (const connection of connectsToArray) {
      const port = this.getSubcircuit().selectOne(connection, {
        type: "port",
      }) as Port | null
      if (port) {
        connectedPorts.push(port)
      }
    }

    return connectedPorts
  }

  _isBoardPinoutFromAttributes(): boolean | undefined {
    const parent = this.parent as any
    if (parent?._parsedProps?.pinAttributes) {
      const pinAttributes = parent._parsedProps.pinAttributes
      for (const alias of this.getNameAndAliases()) {
        if (pinAttributes[alias]?.includeInBoardPinout) {
          return true
        }
      }
    }
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
    const { schX, schY } = this._parsedProps
    if (schX !== undefined && schY !== undefined) {
      return true
    }

    const parentNormalComponent = this.getParentNormalComponent()
    const symbol = parentNormalComponent?.getSchematicSymbol()
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

    const parentBoxDim = parentNormalComponent?._getSchematicBoxDimensions()
    if (parentBoxDim && this.props.pinNumber !== undefined) {
      const localPortPosition = parentBoxDim.getPortPositionByPinNumber(
        this.props.pinNumber!,
      )
      if (localPortPosition) return true
    }

    return false
  }

  _getGlobalSchematicPositionBeforeLayout(): { x: number; y: number } {
    const { schX, schY } = this._parsedProps
    if (schX !== undefined && schY !== undefined) {
      // For ports with explicit coordinates in custom React symbols,
      // use them as absolute coordinates (not relative to the parent)
      return { x: schX, y: schY }
    }

    const parentNormalComponent = this.getParentNormalComponent()
    const symbol = parentNormalComponent?.getSchematicSymbol()
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
        parentNormalComponent!.computeSchematicGlobalTransform(),
        translate(-symbol.center.x, -symbol.center.y),
      )

      return applyToPoint(transform, schematicSymbolPortDef!)
    }

    const parentBoxDim = parentNormalComponent?._getSchematicBoxDimensions()
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
        parentNormalComponent!.computeSchematicGlobalTransform(),
        localPortPosition,
      ) as { x: number; y: number }
    }

    throw new Error(
      `Couldn't find position for schematic_port for port ${this.getString()}`,
    )
  }

  _getGlobalSchematicPositionAfterLayout(): { x: number; y: number } {
    const { db } = this.root!
    if (!this.schematic_port_id) {
      throw new Error(
        `Can't get schematic port position after layout for "${this.getString()}", no schematic_port_id`,
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
        ...(props.name ? [props.name] : []),
        ...(props.aliases ?? []),
        ...(typeof props.pinNumber === "number"
          ? [`pin${props.pinNumber}`, props.pinNumber.toString()]
          : []),
        ...(this.externallyAddedAliases ?? []),
      ]),
    ) as string[]
  }

  private _getMatchingPinAttributes(): PinAttributeMap[] {
    const pinAttributes = (this.parent as any)?._parsedProps?.pinAttributes as
      | Record<string, PinAttributeMap>
      | undefined

    if (!pinAttributes) return []

    const matches: PinAttributeMap[] = []
    for (const alias of this.getNameAndAliases()) {
      const attributes = pinAttributes[alias]
      if (attributes) {
        matches.push(attributes)
      }
    }

    return matches
  }

  private _shouldIncludeInBoardPinout(): boolean {
    return this._getMatchingPinAttributes().some(
      (attributes) => attributes.includeInBoardPinout === true,
    )
  }
  isMatchingPort(port: Port) {
    return this.isMatchingAnyOf(port.getNameAndAliases())
  }
  getPortSelector() {
    // TODO this.parent.getSubcircuitSelector() >
    const parentComponent = this.getParentNormalComponent() ?? this.parent
    return `.${parentComponent?.props.name} > port.${this.props.name}`
  }
  getAvailablePcbLayers(): LayerRef[] {
    const { layer, layers } = this._parsedProps
    if (layers) return layers as LayerRef[]
    if (layer) return [layer as LayerRef]
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

    const connectedTraces = allSubcircuitTraces
      .filter((trace) => !trace._couldNotFindPort)
      .filter((trace) => trace._isExplicitlyConnectedToPort(this))

    return connectedTraces
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const port_hints = this.getNameAndAliases()
    const parentNormalComponent = this.getParentNormalComponent()
    // Prioritize direct parent if it has source_component_id (for primitives like Via)
    // Otherwise use the NormalComponent parent
    const parentWithSourceId = this.parent?.source_component_id
      ? this.parent
      : parentNormalComponent

    // For primitive parents like Via, source_component_id won't be set yet during SourceRender phase
    // (children render before parents). It will be updated in SourceParentAttachment phase.
    const source_component_id = parentWithSourceId?.source_component_id ?? null

    // Get pin attributes from parent component and apply them to this port
    const pinAttributes = this._getMatchingPinAttributes()
    const portAttributesFromParent: any = {}

    for (const attributes of pinAttributes) {
      if (attributes.mustBeConnected !== undefined) {
        portAttributesFromParent.must_be_connected = attributes.mustBeConnected
      }
    }

    const source_port = db.source_port.insert({
      name: props.name!,
      pin_number: props.pinNumber,
      port_hints,
      source_component_id: source_component_id!,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
      ...portAttributesFromParent,
    })

    this.source_port_id = source_port.source_port_id
  }

  doInitialSourceParentAttachment(): void {
    const { db } = this.root!
    const parentNormalComponent = this.getParentNormalComponent()
    const parentWithSourceId = this.parent?.source_component_id
      ? this.parent
      : parentNormalComponent

    // Group ports don't need a source_component_id
    if (this.isGroupPort()) {
      db.source_port.update(this.source_port_id!, {
        source_component_id: null as any,
        subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
      })
      return
    }

    if (!parentWithSourceId?.source_component_id) {
      throw new Error(
        `${this.getString()} has no parent source component (parent: ${this.parent?.getString()})`,
      )
    }

    db.source_port.update(this.source_port_id!, {
      source_component_id: parentWithSourceId.source_component_id!,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id!,
    })

    this.source_component_id = parentWithSourceId.source_component_id
  }

  doInitialPcbPortRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { matchedComponents } = this

    // Handle group ports separately
    if (this.isGroupPort()) {
      const connectedPorts = this._getConnectedPortsFromConnectsTo()
      if (connectedPorts.length === 0) {
        // Group port needs connectsTo to resolve position
        return
      }

      // Get position from the first connected port
      const connectedPort = connectedPorts[0]
      if (!connectedPort.pcb_port_id) {
        // Connected port hasn't been rendered yet, skip for now
        return
      }

      const connectedPcbPort = db.pcb_port.get(connectedPort.pcb_port_id)!
      const matchCenter = { x: connectedPcbPort.x, y: connectedPcbPort.y }

      const subcircuit = this.getSubcircuit()
      const pcb_port = db.pcb_port.insert({
        pcb_component_id: undefined as any,
        layers: connectedPort.getAvailablePcbLayers(),
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        ...matchCenter,
        source_port_id: this.source_port_id!,
        is_board_pinout: false,
      })
      this.pcb_port_id = pcb_port.pcb_port_id
      return
    }

    const parentNormalComponent = this.getParentNormalComponent()
    const parentWithPcbComponentId = this.parent?.pcb_component_id
      ? this.parent
      : parentNormalComponent

    if (!parentWithPcbComponentId?.pcb_component_id) {
      throw new Error(
        `${this.getString()} has no parent pcb component, cannot render pcb_port (parent: ${this.parent?.getString()}, parentNormalComponent: ${parentNormalComponent?.getString()})`,
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
      const isBoardPinout = this._shouldIncludeInBoardPinout()

      const pcb_port = db.pcb_port.insert({
        pcb_component_id: parentWithPcbComponentId.pcb_component_id!,
        layers: this.getAvailablePcbLayers(),
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        ...(isBoardPinout ? { is_board_pinout: true } : {}),
        ...matchCenter,

        source_port_id: this.source_port_id!,
        is_board_pinout: this._isBoardPinoutFromAttributes(),
      })
      this.pcb_port_id = pcb_port.pcb_port_id
    } else {
      const pcbMatch: any = pcbMatches[0]
      throw new Error(
        `${pcbMatch.getString()} does not have a center or _getGlobalPcbPositionBeforeLayout method (needed for pcb_port placement)`,
      )
    }
  }

  updatePcbPortRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!

    // If pcb_port already exists, nothing to do
    if (this.pcb_port_id) return

    // Handle group ports separately
    if (this.isGroupPort()) {
      const connectedPorts = this._getConnectedPortsFromConnectsTo()
      if (connectedPorts.length === 0) return

      const connectedPort = connectedPorts[0]
      if (!connectedPort.pcb_port_id) return

      const connectedPcbPort = db.pcb_port.get(connectedPort.pcb_port_id)!
      const matchCenter = { x: connectedPcbPort.x, y: connectedPcbPort.y }

      const subcircuit = this.getSubcircuit()
      const pcb_port = db.pcb_port.insert({
        pcb_component_id: undefined as any,
        layers: connectedPort.getAvailablePcbLayers(),
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        ...matchCenter,
        source_port_id: this.source_port_id!,
        is_board_pinout: false,
      })
      this.pcb_port_id = pcb_port.pcb_port_id
      return
    }

    // Try again if we now have matched PCB primitives
    const pcbMatches = this.matchedComponents.filter((c) => c.isPcbPrimitive)
    if (pcbMatches.length === 0) return

    let matchCenter: { x: number; y: number } | null = null
    if (pcbMatches.length === 1) {
      matchCenter = pcbMatches[0]._getPcbCircuitJsonBounds().center
    }
    if (pcbMatches.length > 1) {
      try {
        if (areAllPcbPrimitivesOverlapping(pcbMatches as any)) {
          matchCenter = getCenterOfPcbPrimitives(pcbMatches as any)
        }
      } catch {}
    }

    if (!matchCenter) return

    const parentNormalComponent = this.getParentNormalComponent()
    const parentWithPcbComponentId = this.parent?.pcb_component_id
      ? this.parent
      : parentNormalComponent

    const subcircuit = this.getSubcircuit()
    const isBoardPinout = this._shouldIncludeInBoardPinout()
    const pcb_port = db.pcb_port.insert({
      pcb_component_id: parentWithPcbComponentId?.pcb_component_id!,
      layers: this.getAvailablePcbLayers(),
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      ...(isBoardPinout ? { is_board_pinout: true } : {}),
      ...matchCenter,
      source_port_id: this.source_port_id!,
      is_board_pinout: this._isBoardPinoutFromAttributes(),
    })
    this.pcb_port_id = pcb_port.pcb_port_id
  }

  /**
   * Get the best display label for this port based on port_hints
   * Filters out generic patterns and applies showPinAliases logic
   */
  _getBestDisplayPinLabel(): string | undefined {
    const { db } = this.root!
    const sourcePort = db.source_port.get(this.source_port_id!)

    // Filter out generic patterns like "pin1", "1", etc.
    const labelHints: string[] = []
    for (const portHint of sourcePort?.port_hints ?? []) {
      if (portHint.match(/^(pin)?\d+$/)) continue
      if (
        portHint.match(/^(left|right)/) &&
        !sourcePort?.name.match(/^(left|right)/)
      )
        continue
      labelHints.push(portHint)
    }

    const parentNormalComponent = this.getParentNormalComponent()
    const showPinAliases = parentNormalComponent?.props?.showPinAliases

    if (showPinAliases && labelHints.length > 0) {
      return labelHints.join("/")
    } else if (labelHints.length > 0) {
      return labelHints[0]
    }

    return undefined
  }

  doInitialSchematicPortRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const { schX, schY } = props
    const container =
      schX !== undefined && schY !== undefined
        ? this.getParentNormalComponent()
        : this.getPrimitiveContainer()

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

    const bestDisplayPinLabel = this._getBestDisplayPinLabel()
    const parentNormalComponent = this.getParentNormalComponent()

    // Derive side_of_component from direction prop for custom symbols
    const sideOfComponent =
      localPortInfo?.side ??
      (props.direction === "up"
        ? "top"
        : props.direction === "down"
          ? "bottom"
          : props.direction)

    const schematicPortInsertProps: Omit<SchematicPort, "schematic_port_id"> = {
      type: "schematic_port",
      schematic_component_id: parentNormalComponent?.schematic_component_id!,
      center: portCenter,
      source_port_id: this.source_port_id!,
      facing_direction: this.facingDirection,
      distance_from_component_edge: props.schStemLength ?? 0.4,
      side_of_component: sideOfComponent,
      pin_number: props.pinNumber,
      true_ccw_index: localPortInfo?.trueIndex,
      display_pin_label: bestDisplayPinLabel,
      is_connected: false,
    }

    for (const attributes of this._getMatchingPinAttributes()) {
      if (attributes.requiresPower) {
        schematicPortInsertProps.has_input_arrow = true
      }
      if (attributes.providesPower) {
        schematicPortInsertProps.has_output_arrow = true
      }
    }

    const schematic_port = db.schematic_port.insert(schematicPortInsertProps)

    this.schematic_port_id = schematic_port.schematic_port_id

    // Create schematic_line for port stem when schStemLength is specified
    if (props.schStemLength !== undefined && props.schStemLength !== 0) {
      const { schStemLength, direction } = props
      let x2 = portCenter.x
      let y2 = portCenter.y

      // Line goes from port position toward the component body (opposite of direction)
      if (direction === "right") x2 -= schStemLength
      else if (direction === "left") x2 += schStemLength
      else if (direction === "up") y2 -= schStemLength
      else if (direction === "down") y2 += schStemLength

      const stemLine = db.schematic_line.insert({
        schematic_component_id: parentNormalComponent?.schematic_component_id!,
        x1: portCenter.x,
        y1: portCenter.y,
        x2,
        y2,
        stroke_width: 0.02,
        color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
        is_dashed: false,
      })
      this.schematic_stem_line_id = stemLine.schematic_line_id
    }
  }

  doInitialSchematicSymbolResize(): void {
    if (this.root?.schematicDisabled) return
    if (!this.schematic_port_id) return

    const symbol = this._getSymbolAncestor()
    const transform = symbol?.getUserCoordinateToResizedSymbolTransform()
    if (!transform) return

    const { db } = this.root!

    // Transform the schematic_port center
    const schPort = db.schematic_port.get(this.schematic_port_id)
    if (schPort) {
      const newCenter = applyToPoint(transform, schPort.center)
      db.schematic_port.update(this.schematic_port_id, {
        center: newCenter,
      })

      // Transform the stem line: scale the anchor (body-side) endpoint,
      // then re-derive the outer endpoint using the original unscaled
      // stemLength so stems don't stretch with the symbol.
      if (this.schematic_stem_line_id) {
        const line = db.schematic_line.get(this.schematic_stem_line_id)
        if (line) {
          // p1 = outer (port) endpoint, p2 = anchor (body-side) endpoint
          const originalStemLength = Math.sqrt(
            (line.x1 - line.x2) ** 2 + (line.y1 - line.y2) ** 2,
          )

          // Scale the anchor point (body side) with the transform
          const anchorScaled = applyToPoint(transform, {
            x: line.x2,
            y: line.y2,
          })

          // Re-derive outer endpoint from the scaled anchor using
          // the original stem length in the port's direction
          const { direction } = this._parsedProps
          let outerX = anchorScaled.x
          let outerY = anchorScaled.y
          if (direction === "right") outerX += originalStemLength
          else if (direction === "left") outerX -= originalStemLength
          else if (direction === "up") outerY += originalStemLength
          else if (direction === "down") outerY -= originalStemLength

          db.schematic_line.update(this.schematic_stem_line_id, {
            x1: outerX,
            y1: outerY,
            x2: anchorScaled.x,
            y2: anchorScaled.y,
          })

          // Update port center to the outer endpoint
          db.schematic_port.update(this.schematic_port_id!, {
            center: { x: outerX, y: outerY },
            distance_from_component_edge: originalStemLength,
          })
        }
      }
    }
  }

  _getSubcircuitConnectivityKey(): string | undefined {
    return this.root?.db.source_port.get(this.source_port_id!)
      ?.subcircuit_connectivity_map_key
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

  /**
   * Return the text that should be used for the net label for this port if a
   * trace can't be drawn. This net label text usually doesn't appear at this
   * port, but appears at the port it connects to.
   */
  _getNetLabelText(): string | undefined {
    return `${this.parent?.props.name}_${this.props.name}`
  }
}
