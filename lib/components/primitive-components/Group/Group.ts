import {
  type SimpleRouteJson as AutorouterSimpleRouteJson,
  type RerouteRectRegion,
  convertSrjToGraphicsObject,
  getRerouteSimpleRouteJson,
  reconnectReroutedSimpleRouteJsonRegion,
} from "@tscircuit/capacity-autorouter"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import {
  type AutorouterConfig,
  type SchematicPortArrangement,
  type SubcircuitGroupProps,
  groupProps,
} from "@tscircuit/props"
import {
  type AnyCircuitElement,
  type LayerRef,
  type PcbTrace,
  type PcbVia,
  type SchematicComponent,
  type SchematicPort,
  distance,
} from "circuit-json"
import Debug from "debug"
import type { GraphicsObject } from "graphics-debug"

import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { AutorouterError } from "lib/errors/AutorouterError"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { GenericLocalAutorouter } from "lib/utils/autorouting/GenericLocalAutorouter"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createSourceTracesFromOffboardConnections } from "lib/utils/autorouting/createSourceTracesFromOffboardConnections"
import {
  type NormalizedAutorouterConfig,
  getPresetAutoroutingConfig,
} from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { shouldSkipAutoroutingBecauseOfPlacementErrors } from "lib/utils/autorouting/should-skip-autorouting-because-of-placement-errors"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import {
  GROUND_NET_REGEX,
  POWER_NET_REGEX,
} from "lib/utils/gnd-power-net-regex"
import { getRoutePointPosition } from "lib/utils/pcb-trace-route-point-utils"
import { getViaDiameterDefaults } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/public-exports"
import { getPinsFromPortArrangement } from "lib/utils/schematic/getSizeOfSidesFromPortArrangement"
import { z } from "zod"
import { NormalComponent } from "../../base-components/NormalComponent/NormalComponent"
import { Port } from "../Port/Port"
import { Trace } from "../Trace/Trace"
import { TraceHint } from "../TraceHint"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"
import { Group_doInitialAssignSchematicSheetToConnectedComponents } from "./Group_doInitialAssignSchematicSheetToConnectedComponents"
import { Group_doInitialPcbCalcPlacementResolution } from "./Group_doInitialPcbCalcPlacementResolution"
import { Group_doInitialPcbComponentAnchorAlignment } from "./Group_doInitialPcbComponentAnchorAlignment"
import { Group_doInitialPcbLayoutFlex } from "./Group_doInitialPcbLayoutFlex"
import { Group_doInitialPcbLayoutGrid } from "./Group_doInitialPcbLayoutGrid"
import { Group_doInitialPcbLayoutPack } from "./Group_doInitialPcbLayoutPack/Group_doInitialPcbLayoutPack"
import {
  Group_doInitialSchematicBoxComponentRender,
  getGroupSchematicBoxPinLabels,
} from "./Group_doInitialSchematicBoxComponentRender"
import { Group_doInitialSchematicLayoutFlex } from "./Group_doInitialSchematicLayoutFlex"
import { Group_doInitialSchematicLayoutGrid } from "./Group_doInitialSchematicLayoutGrid"
import { Group_doInitialSchematicLayoutMatchAdapt } from "./Group_doInitialSchematicLayoutMatchAdapt"
import { Group_doInitialSchematicLayoutMatchPack } from "./Group_doInitialSchematicLayoutMatchPack"
import { Group_doInitialSchematicLayoutSections } from "./Group_doInitialSchematicLayoutSections"
import { Group_doInitialSchematicTraceRender } from "./Group_doInitialSchematicTraceRender/Group_doInitialSchematicTraceRender"
import { Group_doInitialSimulationSpiceEngineRender } from "./Group_doInitialSimulationSpiceEngineRender"
import { Group_doInitialSourceAddConnectivityMapKey } from "./Group_doInitialSourceAddConnectivityMapKey"
import { Group_getRoutingPhasePlans } from "./Group_getRoutingPhasePlans"
import {
  cacheLocalAutoroutingPhaseResult,
  getCachedLocalAutoroutingPhaseResult,
  getLocalAutoroutingCacheKey,
} from "./Group_localAutoroutingCache"
import {
  Group_applyDrcTolerancesToSimpleRouteJson,
  Group_filterSimpleRouteJsonForPhase,
  Group_getObstaclesFromRoutedTraces,
  Group_hasPhasedAutorouting,
  connectionIsInRoutingPhase,
} from "./Group_phasedAutoroutingUtils"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"
import { addPortIdsToTracesAtJumperPads } from "./add-port-ids-to-traces-at-jumper-pads"
import { getSourceTraceIdForRoutedTrace } from "./get-source-trace-id-for-routed-trace"
import { insertAutoplacedJumpers } from "./insert-autoplaced-jumpers"
import { insertPcbTraceTooLongWarnings } from "./insert-pcb-trace-too-long-warnings"
import {
  deleteExistingPcbTracesReplacedBy,
  getExistingPcbTracesForReroute,
  getExistingSimplifiedPcbTracesForReroute,
  getSourceTraceIdsFromRerouteName,
} from "./region-replacement"
import { splitPcbTracesOnJumperSegments } from "./split-pcb-traces-on-jumper-segments"
import { computeCenterFromAnchorPosition } from "./utils/computeCenterFromAnchorPosition"

const getDistanceToPoint = (
  routePoint: PcbTrace["route"][number],
  targetPoint: { x: number; y: number },
) => {
  const position = getRoutePointPosition(routePoint)
  return Math.hypot(position.x - targetPoint.x, position.y - targetPoint.y)
}

const reversePcbTraceRoute = (route: PcbTrace["route"]): PcbTrace["route"] =>
  route
    .slice()
    .reverse()
    .map((point) => {
      if (point.route_type === "via") {
        return { ...point }
      }

      if (point.route_type === "through_pad") {
        return {
          ...point,
          start: point.end,
          end: point.start,
          start_layer: point.end_layer,
          end_layer: point.start_layer,
        }
      }

      return { ...point }
    })

const ensureRouteStartsAtSourceTraceStart = ({
  db,
  route,
  sourceTraceId,
}: {
  db: CircuitJsonUtilObjects
  route: PcbTrace["route"]
  sourceTraceId?: string
}) => {
  if (!sourceTraceId || route.length < 2) return route

  const sourceTrace = db.source_trace.get(sourceTraceId)
  const firstSourcePortId = sourceTrace?.connected_source_port_ids[0]
  if (!firstSourcePortId) return route

  const firstPcbPort = db.pcb_port
    .list()
    .find((port) => port.source_port_id === firstSourcePortId)
  if (!firstPcbPort) return route

  const firstPoint = route[0]
  const lastPoint = route[route.length - 1]
  return getDistanceToPoint(lastPoint, firstPcbPort) <
    getDistanceToPoint(firstPoint, firstPcbPort)
    ? reversePcbTraceRoute(route)
    : route
}

export class Group<Props extends z.ZodType<any, any, any> = typeof groupProps>
  extends NormalComponent<Props>
  implements ISubcircuit
{
  pcb_group_id: string | null = null
  schematic_group_id: string | null = null
  subcircuit_id: string | null = null

  _hasStartedAsyncAutorouting = false

  _pcbPlacementDrcErrorCount: number | null = null

  _isInflatedFromCircuitJson = false

  _isolatedCircuitJson: AnyCircuitElement[] | null = null

  get _isIsolatedSubcircuit(): boolean {
    return Boolean(this.getInheritedProperty("_subcircuitCachingEnabled"))
  }

  _normalComponentNameMap: Map<string, NormalComponent[]> | null = null

  /**
   * Returns a cached map of component names to NormalComponent instances within this subcircuit.
   * The map is built lazily on first access and cached for subsequent calls.
   */
  getNormalComponentNameMap(): Map<string, NormalComponent[]> {
    if (this._normalComponentNameMap) {
      return this._normalComponentNameMap
    }

    const nameMap = new Map<string, NormalComponent[]>()
    const collectNamedComponents = (component: PrimitiveComponent) => {
      if ((component as NormalComponent)._isNormalComponent && component.name) {
        const componentsWithSameName = nameMap.get(component.name)
        if (componentsWithSameName) {
          componentsWithSameName.push(component as NormalComponent)
        } else {
          nameMap.set(component.name, [component as NormalComponent])
        }
      }
      for (const child of component.children) {
        if (!child.isSubcircuit) collectNamedComponents(child)
      }
    }
    for (const child of this.children) {
      if (!child.isSubcircuit) collectNamedComponents(child)
    }

    this._normalComponentNameMap = nameMap
    return nameMap
  }

  _asyncAutoroutingResult: {
    output_simple_route_json?: SimpleRouteJson
    output_pcb_traces?: (PcbTrace | PcbVia)[]
    // PCB traces that are being re-routed
    pcb_trace_ids_to_be_replaced?: string[]
    input_simple_route_json?: SimpleRouteJson
    output_jumpers?: Array<{
      jumper_footprint: string
      center: { x: number; y: number }
      orientation: string
      pads: Array<{
        center: { x: number; y: number }
        width: number
        height: number
        layer: string
      }>
    }>
  } | null = null

  get config() {
    return {
      zodProps: groupProps as unknown as Props,
      componentName: "Group",
    }
  }

  override initPorts(opts: Parameters<NormalComponent["initPorts"]>[0] = {}) {
    const schPinArrangement = this._getSchematicPortArrangement()
    const hasUnresolvedNamedPins =
      this._parsedProps?.showAsSchematicBox &&
      !this._parsedProps.pinLabels &&
      schPinArrangement &&
      getPinsFromPortArrangement(schPinArrangement).some(
        (pin) => typeof pin === "string",
      )

    if (hasUnresolvedNamedPins) return

    super.initPorts(opts)
  }

  _getSchematicPortArrangementFromPortDirections(): SchematicPortArrangement | null {
    if (!this._parsedProps?.showAsSchematicBox) return null

    const sidePins = {
      leftSide: [] as Array<number | string>,
      rightSide: [] as Array<number | string>,
      topSide: [] as Array<number | string>,
      bottomSide: [] as Array<number | string>,
    }

    for (const port of this.children) {
      if (port.componentName !== "Port") continue

      const direction = port._parsedProps.direction
      if (!direction) continue

      const pin =
        port._parsedProps.pinNumber ?? port._parsedProps.name ?? undefined
      if (pin === undefined) continue

      const side =
        direction === "left"
          ? "leftSide"
          : direction === "right"
            ? "rightSide"
            : direction === "up"
              ? "topSide"
              : "bottomSide"

      sidePins[side].push(pin)
    }

    if (
      sidePins.leftSide.length === 0 &&
      sidePins.rightSide.length === 0 &&
      sidePins.topSide.length === 0 &&
      sidePins.bottomSide.length === 0
    ) {
      return null
    }

    const arrangement: SchematicPortArrangement = {}
    if (sidePins.leftSide.length > 0) {
      arrangement.leftSide = {
        pins: sidePins.leftSide,
        direction: "top-to-bottom",
      }
    }
    if (sidePins.rightSide.length > 0) {
      arrangement.rightSide = {
        pins: sidePins.rightSide,
        direction: "top-to-bottom",
      }
    }
    if (sidePins.topSide.length > 0) {
      arrangement.topSide = {
        pins: sidePins.topSide,
        direction: "left-to-right",
      }
    }
    if (sidePins.bottomSide.length > 0) {
      arrangement.bottomSide = {
        pins: sidePins.bottomSide,
        direction: "left-to-right",
      }
    }

    return arrangement
  }

  override _getSchematicPortArrangement(): SchematicPortArrangement | null {
    return (
      super._getSchematicPortArrangement() ??
      this._getSchematicPortArrangementFromPortDirections()
    )
  }

  private _ensureSchematicBoxPortsFromConnections() {
    if (!this._parsedProps?.showAsSchematicBox) return
    if (!this._parsedProps?.connections) return

    for (const [pinName, target] of Object.entries(
      this._parsedProps.connections,
    )) {
      const existingPort = this.children.find(
        (child) =>
          child.componentName === "Port" &&
          (child as Port).isMatchingAnyOf([pinName]),
      )
      if (existingPort) continue

      const pinNumberMatch =
        pinName.match(/^pin(\d+)$/i) ?? pinName.match(/^(\d+)$/)
      const pinNumber = pinNumberMatch ? Number(pinNumberMatch[1]) : undefined

      this.add(
        new Port({
          name: pinName,
          pinNumber,
          connectsTo: target as any,
        }),
      )
    }
  }

  override doInitialInitializePortsFromChildren(): void {
    super.doInitialInitializePortsFromChildren()
    this._ensureSchematicBoxPortsFromConnections()
  }

  override updateInitializePortsFromChildren(): void {
    super.updateInitializePortsFromChildren()
    this._ensureSchematicBoxPortsFromConnections()
  }

  override _getPrimaryPinCount(): number {
    const superPinCount = super._getPrimaryPinCount()
    if (!this._parsedProps?.showAsSchematicBox) return superPinCount

    const directPortPinNumbers = this.children
      .filter((child): child is Port => child.componentName === "Port")
      .map((port) => port._parsedProps.pinNumber)
      .filter((pinNumber): pinNumber is number => pinNumber !== undefined)

    if (directPortPinNumbers.length === 0) return superPinCount
    return Math.max(superPinCount, ...directPortPinNumbers)
  }

  override _getPinLabelsFromPorts(): Record<string, string> {
    if (!this._parsedProps?.showAsSchematicBox) {
      return super._getPinLabelsFromPorts()
    }
    return getGroupSchematicBoxPinLabels(this as any)
  }

  doInitialSourceGroupRender() {
    const { db } = this.root!
    const hasExplicitName =
      typeof (this._parsedProps as { name?: unknown }).name === "string" &&
      (this._parsedProps as { name?: string }).name!.length > 0

    const source_group = db.source_group.insert({
      name: this.name,
      is_subcircuit: this.isSubcircuit,
      was_automatically_named: !hasExplicitName,
    })
    this.source_group_id = source_group.source_group_id
    if (this.isSubcircuit) {
      this.subcircuit_id = `subcircuit_${source_group.source_group_id}` as any
      db.source_group.update(source_group.source_group_id, {
        subcircuit_id: this.subcircuit_id!,
      })
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!

    // Schematic sheets are transparent, so include their nested components.
    for (const child of this.getDescendants()) {
      if (child.getGroup()?.source_group_id !== this.source_group_id) continue
      db.source_component.update(child.source_component_id!, {
        source_group_id: this.source_group_id!,
      })
    }
  }

  doInitialSourceParentAttachment() {
    const { db } = this.root!
    const parentGroup = this.parent?.getGroup?.()
    if (parentGroup?.source_group_id) {
      db.source_group.update(this.source_group_id!, {
        parent_source_group_id: parentGroup.source_group_id,
      })
    }

    if (!this.isSubcircuit) return
    const parent_subcircuit_id = this.parent?.getSubcircuit?.()?.subcircuit_id
    if (!parent_subcircuit_id) return
    db.source_group.update(this.source_group_id!, {
      parent_subcircuit_id,
    })
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const groupProps = props as SubcircuitGroupProps
    const hasOutline = groupProps.outline && groupProps.outline.length > 0

    const numericOutline = hasOutline
      ? groupProps.outline!.map((point) => ({
          x: distance.parse(point.x),
          y: distance.parse(point.y),
        }))
      : undefined
    const ctx = this.props
    const anchorPosition = this._getGlobalPcbPositionBeforeLayout()
    const center = computeCenterFromAnchorPosition(anchorPosition, ctx)

    const pcb_group = db.pcb_group.insert({
      is_subcircuit: this.isSubcircuit,
      subcircuit_id: this.subcircuit_id ?? this.getSubcircuit()?.subcircuit_id!,
      name: this.name,
      anchor_position: anchorPosition,
      center,
      ...(hasOutline ? { outline: numericOutline } : { width: 0, height: 0 }),
      pcb_component_ids: [],
      source_group_id: this.source_group_id!,
      autorouter_configuration: props.autorouter
        ? {
            trace_clearance: props.autorouter.traceClearance,
          }
        : undefined,
      anchor_alignment: props.pcbAnchorAlignment ?? null,
    })
    this.pcb_group_id = pcb_group.pcb_group_id

    for (const child of this.children) {
      db.pcb_component.update(child.pcb_component_id!, {
        pcb_group_id: pcb_group.pcb_group_id,
      })
    }
  }

  doInitialPcbPrimitiveRender(): void {
    this.calculatePcbGroupBounds()
  }

  calculatePcbGroupBounds() {
    if (!this.pcb_group_id) return
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps as SubcircuitGroupProps

    const hasOutline = props.outline && props.outline.length > 0

    // Check if explicit positioning is provided (pcbX or pcbY)
    const hasExplicitPositioning =
      this._parsedProps.pcbX !== undefined ||
      this._parsedProps.pcbY !== undefined

    // If outline is specified, calculate bounds from outline
    if (hasOutline) {
      const numericOutline = props.outline!.map((point) => ({
        x: distance.parse(point.x),
        y: distance.parse(point.y),
      }))

      const outlineBounds = getBoundsFromPoints(numericOutline)
      if (!outlineBounds) return

      const centerX = (outlineBounds.minX + outlineBounds.maxX) / 2
      const centerY = (outlineBounds.minY + outlineBounds.maxY) / 2

      // Preserve explicit positioning when pcbX/pcbY are set
      // Otherwise use calculated center from outline
      const center = hasExplicitPositioning
        ? (db.pcb_group.get(this.pcb_group_id)?.center ?? {
            x: centerX,
            y: centerY,
          })
        : { x: centerX, y: centerY }

      // For groups with outline, don't set width/height
      db.pcb_group.update(this.pcb_group_id, {
        center,
      })
      return
    }

    // Original logic for groups without outline
    const bounds = getBoundsOfPcbComponents(this.children)

    let width = bounds.width
    let height = bounds.height
    let centerX = (bounds.minX + bounds.maxX) / 2
    let centerY = (bounds.minY + bounds.maxY) / 2

    if (this.isSubcircuit) {
      const { padLeft, padRight, padTop, padBottom } = this._resolvePcbPadding()

      width += padLeft + padRight
      height += padTop + padBottom
      centerX += (padRight - padLeft) / 2
      centerY += (padTop - padBottom) / 2
    }

    const resolvedWidth = Number(props.width ?? width)
    const resolvedHeight = Number(props.height ?? height)
    const existingPcbGroup = db.pcb_group.get(this.pcb_group_id)

    // Preserve explicit positioning when pcbX/pcbY are set. If an anchor
    // alignment is provided, recompute the center after auto-sizing so the
    // requested pcbX/pcbY corresponds to that anchor rather than the center.
    let center = hasExplicitPositioning
      ? (existingPcbGroup?.center ?? {
          x: centerX,
          y: centerY,
        })
      : { x: centerX, y: centerY }

    if (hasExplicitPositioning && props.pcbAnchorAlignment) {
      const anchorPosition = this._getGlobalPcbPositionBeforeLayout()
      const anchorAlignedCenter = computeCenterFromAnchorPosition(
        anchorPosition,
        {
          ...this.props,
          width: resolvedWidth,
          height: resolvedHeight,
        },
      )

      if (
        Math.abs(anchorAlignedCenter.x - center.x) > 1e-6 ||
        Math.abs(anchorAlignedCenter.y - center.y) > 1e-6
      ) {
        this._repositionOnPcb(anchorAlignedCenter)
      }

      center = anchorAlignedCenter
    }

    db.pcb_group.update(this.pcb_group_id, {
      width: resolvedWidth,
      height: resolvedHeight,
      center,
    })
  }

  updatePcbPrimitiveRender(): void {
    this.calculatePcbGroupBounds()
  }

  unnamedElementCounter: Record<string, number> = {}
  getNextAvailableName(elm: PrimitiveComponent): string {
    this.unnamedElementCounter[elm.lowercaseComponentName] ??= 1
    return `unnamed_${elm.lowercaseComponentName}${this.unnamedElementCounter[elm.lowercaseComponentName]++}`
  }

  _resolvePcbPadding(): {
    padLeft: number
    padRight: number
    padTop: number
    padBottom: number
  } {
    const props = this._parsedProps as SubcircuitGroupProps
    const layout = props.pcbLayout

    // Helper function to get a padding value from layout or props
    const getPaddingValue = (key: string): number | undefined => {
      const layoutValue = layout?.[key as keyof typeof layout] as
        | number
        | undefined
      const propsValue = props[key as keyof typeof props] as number | undefined

      if (typeof layoutValue === "number") return layoutValue
      if (typeof propsValue === "number") return propsValue
      return undefined
    }

    const generalPadding = getPaddingValue("padding") ?? 0
    const paddingX = getPaddingValue("paddingX")
    const paddingY = getPaddingValue("paddingY")

    const padLeft = getPaddingValue("paddingLeft") ?? paddingX ?? generalPadding
    const padRight =
      getPaddingValue("paddingRight") ?? paddingX ?? generalPadding
    const padTop = getPaddingValue("paddingTop") ?? paddingY ?? generalPadding
    const padBottom =
      getPaddingValue("paddingBottom") ?? paddingY ?? generalPadding

    return { padLeft, padRight, padTop, padBottom }
  }

  doInitialCreateTraceHintsFromProps(): void {
    const { _parsedProps: props } = this
    const { db } = this.root!

    const groupProps = props as SubcircuitGroupProps

    if (!this.isSubcircuit) return

    const manualTraceHints = groupProps.manualEdits?.manual_trace_hints

    if (!manualTraceHints) return

    for (const manualTraceHint of manualTraceHints) {
      this.add(
        new TraceHint({
          for: manualTraceHint.pcb_port_selector,
          offsets: manualTraceHint.offsets,
        }),
      )
    }
  }

  doInitialSourceAddConnectivityMapKey(): void {
    Group_doInitialSourceAddConnectivityMapKey(this)
    Group_doInitialAssignSchematicSheetToConnectedComponents(this)
  }

  _areChildSubcircuitsRouted(): boolean {
    const subcircuitChildren = this._findDirectChildSubcircuits()
    for (const subcircuitChild of subcircuitChildren) {
      // Skip children that will never produce an autorouting result:
      // - inflated subcircuits are already fully routed from circuitJson
      // - subcircuits with no traces to route never start autorouting
      if (subcircuitChild._isInflatedFromCircuitJson) continue
      if (!subcircuitChild._hasTracesToRoute()) continue
      if (
        subcircuitChild._shouldRouteAsync() &&
        !subcircuitChild._asyncAutoroutingResult
      ) {
        return false
      }
    }
    return true
  }

  /**
   * Find subcircuit groups that are direct children of this subcircuit in
   * the component tree. Unlike selectAll("group"), this walks the children
   * array directly because the css-select adapter used by selectAll
   * intentionally skips subcircuit boundaries.
   */
  _findDirectChildSubcircuits(): Group[] {
    const result: Group[] = []
    const visit = (children: typeof this.children) => {
      for (const child of children) {
        if ((child as Group).isSubcircuit && child !== this) {
          result.push(child as Group)
        } else {
          visit(child.children)
        }
      }
    }
    visit(this.children)
    return result
  }

  _shouldRouteAsync(): boolean {
    const autorouter = this._getAutorouterConfig()
    if (autorouter.groupMode === "sequential-trace") return false
    // Local subcircuit mode should use async routing with the CapacityMeshAutorouter
    if (autorouter.local && autorouter.groupMode === "subcircuit") return true
    // Remote autorouting always uses async
    if (!autorouter.local) return true
    return false
  }

  _getRoutingPhasePlans(): RoutingPhasePlan[] {
    return Group_getRoutingPhasePlans(this)
  }

  _hasTracesToRoute(): boolean {
    const debug = Debug("tscircuit:core:_hasTracesToRoute")
    const routingPhasePlans = this._getRoutingPhasePlans()
    let traceCount = 0
    let hasReroutePhaseWithRegion = false
    for (const routingPhasePlan of routingPhasePlans) {
      traceCount += routingPhasePlan.traces.length
      hasReroutePhaseWithRegion ||= Boolean(
        routingPhasePlan.reroute && routingPhasePlan.region,
      )
    }
    debug(`[${this.getString()}] has ${traceCount} traces to route`)
    if (traceCount > 0) return true

    if (hasReroutePhaseWithRegion) {
      const existingTraceCount = getExistingPcbTracesForReroute(this).length
      debug(
        `[${this.getString()}] has ${existingTraceCount} existing pcb traces available for reroute`,
      )
      return existingTraceCount > 0
    }

    return false
  }

  async _runEffectMakeHttpAutoroutingRequest() {
    const { db } = this.root!
    const debug = Debug("tscircuit:core:_runEffectMakeHttpAutoroutingRequest")
    const props = this._parsedProps as SubcircuitGroupProps

    const autorouterConfig = this._getAutorouterConfig()

    // Remote autorouting
    const serverUrl = autorouterConfig.serverUrl!
    const serverMode = autorouterConfig.serverMode!

    const fetchWithDebug = (url: string, options: RequestInit) => {
      debug("fetching", url)
      if (options.headers) {
        // @ts-ignore
        options.headers["Tscircuit-Core-Version"] = this.root?.getCoreVersion()!
      }
      return fetch(url, options)
    }

    // Only include source and pcb elements
    const pcbAndSourceCircuitJson = this.root!.db.toArray().filter(
      (element) => {
        return (
          element.type.startsWith("source_") || element.type.startsWith("pcb_")
        )
      },
    )

    if (serverMode === "solve-endpoint") {
      // Legacy solve endpoint mode
      if (this.props.autorouter?.inputFormat === "simplified") {
        const preferredTraceWidth =
          props.defaultTraceWidth ?? props.nominalTraceWidth
        const { autorouting_result } = await fetchWithDebug(
          `${serverUrl}/autorouting/solve`,
          {
            method: "POST",
            body: JSON.stringify({
              input_simple_route_json: getSimpleRouteJsonFromCircuitJson({
                db,
                minTraceWidth: Number(props.minTraceWidth ?? 0.15),
                nominalTraceWidth:
                  preferredTraceWidth != null
                    ? Number(preferredTraceWidth)
                    : undefined,
                subcircuit_id: this.subcircuit_id,
                subcircuitComponent: this,
              }).simpleRouteJson,
              subcircuit_id: this.subcircuit_id!,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          },
        ).then((r) => r.json())
        this._asyncAutoroutingResult = autorouting_result
        this._markDirty("PcbTraceRender")
        return
      }

      const { autorouting_result } = await fetchWithDebug(
        `${serverUrl}/autorouting/solve`,
        {
          method: "POST",
          body: JSON.stringify({
            input_circuit_json: pcbAndSourceCircuitJson,
            subcircuit_id: this.subcircuit_id!,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      ).then((r) => r.json())
      this._asyncAutoroutingResult = autorouting_result
      this._markDirty("PcbTraceRender")
      return
    }

    const { autorouting_job } = await fetchWithDebug(
      `${serverUrl}/autorouting/jobs/create`,
      {
        method: "POST",
        body: JSON.stringify({
          input_circuit_json: pcbAndSourceCircuitJson,
          provider: "freerouting",
          autostart: true,
          display_name: this.root?.name,
          subcircuit_id: this.subcircuit_id,
          server_cache_enabled: autorouterConfig.serverCacheEnabled,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    ).then((r) => r.json())

    // Poll until job is complete
    while (true) {
      const { autorouting_job: job } = (await fetchWithDebug(
        `${serverUrl}/autorouting/jobs/get`,
        {
          method: "POST",
          body: JSON.stringify({
            autorouting_job_id: autorouting_job.autorouting_job_id,
          }),
          headers: { "Content-Type": "application/json" },
        },
      ).then((r) => r.json())) as {
        autorouting_job: {
          autorouting_job_id: string
          is_running: boolean
          is_started: boolean
          is_finished: boolean
          has_error: boolean
          error: { message: string } | null
          autorouting_provider: "freerouting" | "tscircuit"
          created_at: string
          started_at?: string
          finished_at?: string
        }
      }
      if (job.is_finished) {
        const { autorouting_job_output } = await fetchWithDebug(
          `${serverUrl}/autorouting/jobs/get_output`,
          {
            method: "POST",
            body: JSON.stringify({
              autorouting_job_id: autorouting_job.autorouting_job_id,
            }),
            headers: { "Content-Type": "application/json" },
          },
        ).then((r) => r.json())

        this._asyncAutoroutingResult = {
          output_pcb_traces: autorouting_job_output.output_pcb_traces,
        }
        this._markDirty("PcbTraceRender")
        break
      }

      if (job.has_error) {
        const err = new AutorouterError(
          `Autorouting job failed: ${JSON.stringify(job.error)}`,
        )
        db.pcb_autorouting_error.insert({
          pcb_error_id: autorouting_job.autorouting_job_id,
          error_type: "pcb_autorouting_error",
          message: err.message,
        })
        throw err
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * Run local autorouting using the CapacityMeshAutorouter
   */
  async _runLocalAutorouting() {
    const { db } = this.root!
    const props = this._parsedProps as SubcircuitGroupProps
    const debug = Debug("tscircuit:core:_runLocalAutorouting")
    debug(`[${this.getString()}] starting local autorouting`)
    const autorouterConfig = this._getAutorouterConfig()
    const isLaserPrefabPreset = this._isLaserPrefabAutorouter(autorouterConfig)
    const isAutoJumperPreset = this._isAutoJumperAutorouter(autorouterConfig)
    const isSingleLayerBoard = this._getSubcircuitLayerCount() === 1

    const minTraceWidth = Number(props.minTraceWidth ?? 0.15)
    const nominalTraceWidth = Number(
      props.defaultTraceWidth ?? props.nominalTraceWidth ?? minTraceWidth,
    )

    const { simpleRouteJson: baseSimpleRouteJson } =
      getSimpleRouteJsonFromCircuitJson({
        db,
        minTraceWidth,
        nominalTraceWidth,
        subcircuit_id: this.subcircuit_id,
        subcircuitComponent: this,
      })
    const routingPhasePlans = this._getRoutingPhasePlans()
    const hasPhasedAutorouting = Group_hasPhasedAutorouting(routingPhasePlans)
    const outputTraces: SimplifiedPcbTrace[] = []
    const outputJumpers: Array<{
      jumper_footprint: string
      center: { x: number; y: number }
      orientation: string
      pads: Array<{
        center: { x: number; y: number }
        width: number
        height: number
        layer: string
      }>
    }> = []
    const pcbTraceIdsToDelete = new Set<string>()
    const existingRerouteSeedTraces =
      getExistingSimplifiedPcbTracesForReroute(this)

    const traceMatchesRoutingPhase = (
      trace: SimplifiedPcbTrace,
      routingPhasePlan: RoutingPhasePlan,
    ): boolean => {
      const connectionName = trace.connection_name ?? trace.pcb_trace_id
      const sourceTraceIds = new Set([
        connectionName,
        trace.pcb_trace_id,
        ...getSourceTraceIdsFromRerouteName(connectionName),
        ...getSourceTraceIdsFromRerouteName(trace.pcb_trace_id),
      ])

      return baseSimpleRouteJson.connections.some((connection) => {
        if (!connectionIsInRoutingPhase(connection, routingPhasePlan)) {
          return false
        }
        return (
          sourceTraceIds.has(connection.name) ||
          (connection.source_trace_id
            ? sourceTraceIds.has(connection.source_trace_id)
            : false) ||
          (connection.rootConnectionName
            ? sourceTraceIds.has(connection.rootConnectionName)
            : false) ||
          connection.mergedConnectionNames?.some((name) =>
            sourceTraceIds.has(name),
          )
        )
      })
    }

    for (const routingPhasePlan of routingPhasePlans) {
      const phaseAutorouterConfig: NormalizedAutorouterConfig =
        routingPhasePlan.autorouter
          ? getPresetAutoroutingConfig(
              routingPhasePlan.autorouter,
              this.root?.platform,
            )
          : autorouterConfig
      let simpleRouteJson = baseSimpleRouteJson
      const isRegionReroutePhase = Boolean(
        routingPhasePlan.reroute && routingPhasePlan.region,
      )
      const isConnectionReroutePhase = Boolean(
        routingPhasePlan.reroute &&
          !routingPhasePlan.region &&
          routingPhasePlan.traces.length > 0,
      )
      const isReroutePhase = isRegionReroutePhase || isConnectionReroutePhase
      const rerouteOriginalSrj = isRegionReroutePhase
        ? {
            ...baseSimpleRouteJson,
            traces: [...existingRerouteSeedTraces, ...outputTraces],
          }
        : null

      if (isRegionReroutePhase && rerouteOriginalSrj) {
        simpleRouteJson = getRerouteSimpleRouteJson(
          rerouteOriginalSrj as AutorouterSimpleRouteJson,
          {
            shape: "rect",
            ...routingPhasePlan.region,
          } as RerouteRectRegion,
        ) as SimpleRouteJson
      } else if (isConnectionReroutePhase) {
        simpleRouteJson = Group_filterSimpleRouteJsonForPhase(
          baseSimpleRouteJson,
          routingPhasePlan,
        )
        simpleRouteJson.obstacles = [
          ...simpleRouteJson.obstacles,
          ...Group_getObstaclesFromRoutedTraces(
            outputTraces.filter(
              (trace) => !traceMatchesRoutingPhase(trace, routingPhasePlan),
            ),
            baseSimpleRouteJson.layerCount,
          ),
        ]
      } else if (hasPhasedAutorouting) {
        simpleRouteJson = Group_filterSimpleRouteJsonForPhase(
          baseSimpleRouteJson,
          routingPhasePlan,
        )
        simpleRouteJson.obstacles = [
          ...simpleRouteJson.obstacles,
          ...Group_getObstaclesFromRoutedTraces(
            outputTraces,
            baseSimpleRouteJson.layerCount,
          ),
        ]
      }
      simpleRouteJson = Group_applyDrcTolerancesToSimpleRouteJson(
        simpleRouteJson,
        routingPhasePlan.drcTolerances,
      )

      if (
        (hasPhasedAutorouting || isReroutePhase) &&
        simpleRouteJson.connections.length === 0
      ) {
        continue
      }

      // Enable jumpers for auto_jumper preset
      const phaseIsAutoJumperPreset =
        routingPhasePlan.autorouter !== undefined
          ? this._isAutoJumperAutorouter(phaseAutorouterConfig)
          : isAutoJumperPreset
      const phaseIsLaserPrefabPreset =
        routingPhasePlan.autorouter !== undefined
          ? this._isLaserPrefabAutorouter(phaseAutorouterConfig)
          : isLaserPrefabPreset

      if (phaseIsAutoJumperPreset) {
        simpleRouteJson.allowJumpers = true
        if (phaseAutorouterConfig.availableJumperTypes) {
          simpleRouteJson.availableJumperTypes =
            phaseAutorouterConfig.availableJumperTypes
        }
      }

      if (debug.enabled) {
        ;(global as any).debugOutputArray?.push({
          name: `simpleroutejson-${this.props.name}.json`,
          obj: simpleRouteJson,
        })
      }

      if (debug.enabled) {
        const graphicsObject = convertSrjToGraphicsObject(
          simpleRouteJson as any,
        ) as GraphicsObject
        graphicsObject.title = `autorouting-${this.props.name}`
        ;(global as any).debugGraphics?.push(graphicsObject)
      }

      this.root?.emit("autorouting:start", {
        subcircuit_id: this.subcircuit_id,
        componentDisplayName: this.getString(),
        simpleRouteJson,
      })

      const cacheEngine = phaseAutorouterConfig.algorithmFn
        ? undefined
        : this.root?.platform?.localCacheEngine
      const cacheKey = cacheEngine
        ? getLocalAutoroutingCacheKey(simpleRouteJson)
        : undefined
      const cachedResult = cacheKey
        ? await getCachedLocalAutoroutingPhaseResult({ cacheEngine, cacheKey })
        : null
      let autorouter: GenericLocalAutorouter | undefined

      try {
        let traces: SimplifiedPcbTrace[]
        if (cachedResult) {
          debug(`[${this.getString()}] using cached local autorouting result`)
          traces = cachedResult.traces
        } else {
          if (phaseAutorouterConfig.algorithmFn) {
            autorouter =
              await phaseAutorouterConfig.algorithmFn(simpleRouteJson)
          } else {
            const autorouterVersion = this.props.autorouterVersion
            const effortLevel = this.props.autorouterEffortLevel
            const effort = effortLevel
              ? Number.parseInt(effortLevel.replace("x", ""), 10)
              : undefined
            autorouter = new TscircuitAutorouter(simpleRouteJson, {
              capacityDepth: phaseAutorouterConfig.capacityDepth,
              targetMinCapacity: phaseAutorouterConfig.targetMinCapacity,
              useAssignableSolver:
                phaseIsLaserPrefabPreset || isSingleLayerBoard,
              useAutoJumperSolver: phaseIsAutoJumperPreset,
              useLaserPrefabSolver: phaseIsLaserPrefabPreset,
              autorouterVersion,
              effort,
              onSolverStarted: ({ solverName, solverParams }) =>
                this.root?.emit("solver:started", {
                  type: "solver:started",
                  solverName,
                  solverParams,
                  componentName: this.getString(),
                }),
            })
          }

          if (!autorouter) {
            throw new Error("Failed to create local autorouter")
          }
          const activeAutorouter = autorouter
          const routingPromise = new Promise<SimplifiedPcbTrace[]>(
            (resolve, reject) => {
              activeAutorouter.on("complete", (event) => {
                debug(`[${this.getString()}] local autorouting complete`)
                resolve(event.traces)
              })

              activeAutorouter.on("error", (event) => {
                debug(
                  `[${this.getString()}] local autorouting error: ${event.error.message}`,
                )
                reject(event.error)
              })
            },
          )

          activeAutorouter.on("progress", (event) => {
            this.root?.emit("autorouting:progress", {
              subcircuit_id: this.subcircuit_id,
              componentDisplayName: this.getString(),
              ...event,
            })
          })

          activeAutorouter.start()
          traces = await routingPromise
        }

        const outputSimpleRouteJson = {
          ...simpleRouteJson,
          traces,
        }

        if (!cachedResult && cacheKey) {
          await cacheLocalAutoroutingPhaseResult({
            cacheEngine,
            cacheKey,
            result: outputSimpleRouteJson,
          })
        }

        this.root?.emit("autorouting:end", {
          type: "autorouting:end",
          subcircuit_id: this.subcircuit_id,
          componentDisplayName: this.getString(),
          simpleRouteJson: outputSimpleRouteJson,
        })

        // Create source_traces for interconnect ports that were connected via
        // off-board paths during routing. This allows DRC to understand that
        // these ports are intentionally connected.
        if (autorouter?.getConnectedOffboardObstacles) {
          const connectedOffboardObstacles =
            autorouter.getConnectedOffboardObstacles()
          createSourceTracesFromOffboardConnections({
            db,
            connectedOffboardObstacles,
            simpleRouteJson,
            subcircuit_id: this.subcircuit_id,
          })
        }

        // Get jumper output from solver
        const solver = (autorouter as any)?.solver
        if (solver?.getOutputJumpers) {
          outputJumpers.push(...(solver.getOutputJumpers() || []))
        }

        if (isRegionReroutePhase && rerouteOriginalSrj) {
          for (const trace of rerouteOriginalSrj.traces ?? []) {
            if (trace.type === "pcb_trace") {
              pcbTraceIdsToDelete.add(trace.pcb_trace_id)
            }
          }
          const reconnectedSrj = reconnectReroutedSimpleRouteJsonRegion(
            rerouteOriginalSrj as AutorouterSimpleRouteJson,
            {
              ...simpleRouteJson,
              traces: [...(simpleRouteJson.traces ?? []), ...traces],
            } as AutorouterSimpleRouteJson,
          ) as SimpleRouteJson
          outputTraces.splice(
            0,
            outputTraces.length,
            ...(reconnectedSrj.traces ?? []),
          )
        } else if (isConnectionReroutePhase) {
          outputTraces.splice(
            0,
            outputTraces.length,
            ...outputTraces.filter(
              (trace) => !traceMatchesRoutingPhase(trace, routingPhasePlan),
            ),
            ...traces,
          )
        } else {
          outputTraces.push(...traces)
        }
      } catch (error) {
        const { db } = this.root!
        // Record the error
        db.pcb_autorouting_error.insert({
          pcb_error_id: `pcb_autorouter_error_subcircuit_${this.subcircuit_id}`,
          error_type: "pcb_autorouting_error",
          message: error instanceof Error ? error.message : String(error),
        })

        this.root?.emit("autorouting:error", {
          subcircuit_id: this.subcircuit_id,
          componentDisplayName: this.getString(),
          error: {
            message: error instanceof Error ? error.message : String(error),
          },
          simpleRouteJson,
        })

        throw error
      } finally {
        // Ensure the autorouter is stopped
        autorouter?.stop()
      }
    }

    // Store the result
    this._asyncAutoroutingResult = {
      output_pcb_traces: outputTraces as any,
      output_jumpers: outputJumpers,
      pcb_trace_ids_to_be_replaced: [...pcbTraceIdsToDelete],
      input_simple_route_json: baseSimpleRouteJson,
    }

    // Mark the component as needing to re-render the PCB traces
    this._markDirty("PcbTraceRender")
  }

  _startAsyncAutorouting() {
    if (this._hasStartedAsyncAutorouting) return
    this._hasStartedAsyncAutorouting = true
    if (this._getAutorouterConfig().local) {
      this._queueAsyncEffect("capacity-mesh-autorouting", async () =>
        this._runLocalAutorouting(),
      )
    } else {
      this._queueAsyncEffect("make-http-autorouting-request", async () =>
        this._runEffectMakeHttpAutoroutingRequest(),
      )
    }
  }

  doInitialPcbTraceRender() {
    const debug = Debug("tscircuit:core:doInitialPcbTraceRender")
    if (!this.isSubcircuit) return
    if (this.root?.pcbDisabled) return
    if (
      this.root?.pcbRoutingDisabled ||
      this.getInheritedProperty("routingDisabled")
    )
      return
    if (this._isInflatedFromCircuitJson) return
    if (this._shouldUseTraceByTraceRouting()) return

    if (!this._areChildSubcircuitsRouted()) {
      debug(
        `[${this.getString()}] child subcircuits are not routed, skipping async autorouting until subcircuits routed`,
      )
      return
    }

    debug(
      `[${this.getString()}] no child subcircuits to wait for, initiating async routing`,
    )
    if (!this._hasTracesToRoute()) return
    if (
      shouldSkipAutoroutingBecauseOfPlacementErrors({
        component: this,
        subcircuit: this,
      })
    )
      return
    this._startAsyncAutorouting()
  }

  doInitialSchematicTraceRender() {
    if (this._parsedProps.showAsSchematicBox) return
    Group_doInitialSchematicTraceRender(this as any)
  }

  updatePcbTraceRender() {
    const debug = Debug("tscircuit:core:updatePcbTraceRender")
    debug(`[${this.getString()}] updating...`)
    if (!this.isSubcircuit) return
    if (this._isInflatedFromCircuitJson) return
    if (
      this._shouldRouteAsync() &&
      this._hasTracesToRoute() &&
      !this._hasStartedAsyncAutorouting
    ) {
      if (this._areChildSubcircuitsRouted()) {
        if (
          shouldSkipAutoroutingBecauseOfPlacementErrors({
            component: this,
            subcircuit: this,
          })
        )
          return
        debug(
          `[${this.getString()}] child subcircuits are now routed, starting async autorouting`,
        )
        this._startAsyncAutorouting()
      }
      return
    }

    if (!this._asyncAutoroutingResult) return
    if (this._shouldUseTraceByTraceRouting()) return

    const { db } = this.root!

    if (this._asyncAutoroutingResult.output_simple_route_json) {
      debug(
        `[${this.getString()}] updating PCB traces from simple route json (${this._asyncAutoroutingResult.output_simple_route_json.traces?.length} traces)`,
      )
      this._updatePcbTraceRenderFromSimpleRouteJson()
      return
    }

    if (this._asyncAutoroutingResult.output_pcb_traces) {
      debug(
        `[${this.getString()}] updating PCB traces from ${this._asyncAutoroutingResult.output_pcb_traces.length} traces`,
      )
      this._updatePcbTraceRenderFromPcbTraces()
      return
    }
  }

  _updatePcbTraceRenderFromSimpleRouteJson() {
    const { db } = this.root!
    const { traces: routedTraces } =
      this._asyncAutoroutingResult!.output_simple_route_json!

    if (!routedTraces) return

    // Delete any previously created traces
    // TODO

    // Apply each routed trace to the corresponding circuit trace
    // const circuitTraces = this.selectAll("trace") as Trace[]
    for (const routedTrace of routedTraces) {
      const cjRoute = routedTrace.route.map((point) => {
        if (point.route_type !== "through_obstacle") return point

        return {
          route_type: "through_pad",
          start: point.start,
          end: point.end,
          start_layer: point.from_layer,
          end_layer: point.to_layer,
          width: point.width,
        }
      })
      // const circuitTrace = circuitTraces.find(
      //   (t) => t.source_trace_id === routedTrace.,
      // )

      // Create the PCB trace with the routed path
      // TODO use upsert to make sure we're not re-creating traces
      const pcb_trace = db.pcb_trace.insert({
        subcircuit_id: this.subcircuit_id!,
        route: cjRoute as any,
        // source_trace_id: circuitTrace.source_trace_id!,
      })
      // circuitTrace.pcb_trace_id = pcb_trace.pcb_trace_id

      // Create vias for any layer transitions
      // for (const point of routedTrace.route) {
      //   if (point.route_type === "via") {
      //     db.pcb_via.insert({
      //       pcb_trace_id: pcb_trace.pcb_trace_id,
      //       x: point.x,
      //       y: point.y,
      //       hole_diameter: 0.3,
      //       outer_diameter: 0.6,
      //       layers: [point.from_layer as LayerRef, point.to_layer as LayerRef],
      //       from_layer: point.from_layer as LayerRef,
      //       to_layer: point.to_layer as LayerRef,
      //     })
      //   }
      // }
    }
  }

  _updatePcbTraceRenderFromPcbTraces() {
    const {
      output_pcb_traces,
      output_jumpers,
      pcb_trace_ids_to_be_replaced,
      input_simple_route_json,
    } = this._asyncAutoroutingResult!
    if (!output_pcb_traces) return

    const { db } = this.root!

    // Delete any previously created traces
    // TODO

    // Apply each routed trace to the corresponding circuit trace
    const pcbStyle = this.getInheritedMergedProperty("pcbStyle")
    const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)
    const board = db.pcb_board.list()[0]
    const routedViaHoleDiameter = board?.min_via_hole_diameter ?? holeDiameter
    const routedViaPadDiameter = board?.min_via_pad_diameter ?? padDiameter

    // First, create jumper components from getOutputJumpers() result
    if (output_jumpers && output_jumpers.length > 0) {
      insertAutoplacedJumpers({
        db,
        output_jumpers,
        subcircuit_id: this.subcircuit_id,
      })
    }

    deleteExistingPcbTracesReplacedBy({
      group: this,
      outputPcbTraces: output_pcb_traces,
      pcbTraceIdsToReplace: pcb_trace_ids_to_be_replaced,
    })

    for (const pcb_trace of output_pcb_traces) {
      // vias can be included
      if (pcb_trace.type !== "pcb_trace") continue

      pcb_trace.subcircuit_id ??= this.subcircuit_id!

      let cjRoute = pcb_trace.route.map((point: any) => {
        if (point.route_type !== "through_obstacle") return point
        return {
          route_type: "through_pad",
          start: point.start,
          end: point.end,
          start_layer: point.from_layer,
          end_layer: point.to_layer,
          width: point.width,
        }
      })
      const routeSourceTraceId = getSourceTraceIdForRoutedTrace({
        db,
        trace: {
          ...pcb_trace,
          route: cjRoute,
        },
        subcircuit_id: this.subcircuit_id,
      })
      cjRoute = ensureRouteStartsAtSourceTraceStart({
        db,
        route: cjRoute as PcbTrace["route"],
        sourceTraceId: routeSourceTraceId,
      })
      pcb_trace.route = cjRoute as typeof pcb_trace.route

      // Split traces at jumper locations (based on explicit jumper route markers)
      let segments = splitPcbTracesOnJumperSegments(cjRoute)

      // If no explicit jumper splits, use the original route
      if (segments === null) {
        segments = [cjRoute]
      }

      // Add port IDs to trace segments at jumper pad locations
      const processedSegments = addPortIdsToTracesAtJumperPads(segments, db)

      // Insert each segment as a separate trace
      for (const segment of processedSegments) {
        if (segment.length > 0) {
          const sourceTraceId = getSourceTraceIdForRoutedTrace({
            db,
            trace: {
              ...pcb_trace,
              route: segment,
            },
            subcircuit_id: this.subcircuit_id,
          })
          db.pcb_trace.insert({
            ...pcb_trace,
            source_trace_id: sourceTraceId,
            route: segment,
          })
        }
      }
    }

    // Create vias for layer transitions (this shouldn't be necessary, but
    // the Circuit JSON spec is ambiguous as to whether a via should have a
    // separate element from the route)
    for (const pcb_trace of output_pcb_traces) {
      if (pcb_trace.type === "pcb_via") {
        // TODO handling here- may need to handle if redundant with pcb_trace
        // below (i.e. don't insert via if one already exists at that location)
        continue
      }
      if (pcb_trace.type === "pcb_trace") {
        const sourceTraceId = getSourceTraceIdForRoutedTrace({
          db,
          trace: pcb_trace,
          subcircuit_id: this.subcircuit_id,
        })
        // NOTE: inputConnectionName isn't really robust- this is from the
        // SRJ we provided to the autorouter- use with caution!
        const { connection_name: inputConnectionName } = pcb_trace as any

        let subcircuitConnectivityMapKey: string | undefined
        if (sourceTraceId) {
          subcircuitConnectivityMapKey =
            db.source_trace.get(sourceTraceId)?.subcircuit_connectivity_map_key
        }
        if (!subcircuitConnectivityMapKey && inputConnectionName) {
          const sourceNet = db.source_net.get(inputConnectionName)
          if (sourceNet) {
            subcircuitConnectivityMapKey =
              sourceNet.subcircuit_connectivity_map_key
          }
        }

        for (const point of pcb_trace.route) {
          if (point.route_type === "via") {
            const routedViaPoint = point as typeof point & {
              via_diameter?: number
              via_hole_diameter?: number
              outer_diameter?: number
              hole_diameter?: number
            }
            const fromLayer = point.from_layer as LayerRef
            const toLayer = point.to_layer as LayerRef
            db.pcb_via.insert({
              pcb_trace_id: pcb_trace.pcb_trace_id,
              x: point.x,
              y: point.y,
              hole_diameter:
                routedViaPoint.via_hole_diameter ??
                routedViaPoint.hole_diameter ??
                routedViaHoleDiameter,
              outer_diameter:
                routedViaPoint.via_diameter ??
                routedViaPoint.outer_diameter ??
                routedViaPadDiameter,
              layers: getViaBoardLayers(this._getSubcircuitLayerCount()),
              from_layer: fromLayer,
              to_layer: toLayer,
              subcircuit_id: this.subcircuit_id!,
              pcb_group_id: this.pcb_group_id ?? undefined,
              subcircuit_connectivity_map_key: subcircuitConnectivityMapKey,
            })
          }
        }
      }
    }
  }

  doInitialSchematicComponentRender() {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const schematic_group = db.schematic_group.insert({
      is_subcircuit: this.isSubcircuit,
      subcircuit_id: this.subcircuit_id!,
      name: this.name,
      center: this._getGlobalSchematicPositionBeforeLayout(),
      width: 0,
      height: 0,
      schematic_component_ids: [],
      source_group_id: this.source_group_id!,
      show_as_schematic_box: props.showAsSchematicBox ?? false,
    })
    this.schematic_group_id = schematic_group.schematic_group_id

    if (props.showAsSchematicBox) {
      Group_doInitialSchematicBoxComponentRender(this)
    }

    // Apply group placement through transparent schematic sheets.
    for (const child of this.getDescendants()) {
      if (child.getGroup()?.source_group_id !== this.source_group_id) continue
      if ((child as any)._parsedProps?.showAsSchematicBox) continue
      if (child.schematic_component_id) {
        db.schematic_component.update(child.schematic_component_id, {
          schematic_group_id: schematic_group.schematic_group_id,
        })
      }
    }
  }

  _getSchematicLayoutMode(): "match-adapt" | "flex" | "grid" | "relative" {
    const props = this._parsedProps as SubcircuitGroupProps
    const schAutoLayoutEnabled = props.schAutoLayoutEnabled ?? false
    if (props.schLayout?.layoutMode === "none") return "relative"
    if (props.schLayout?.layoutMode === "relative") return "relative"
    if (props.schLayout?.matchAdapt) return "match-adapt"
    if (props.schLayout?.flex) return "flex"
    if (props.schLayout?.grid) return "grid"
    if (props.schMatchAdapt) return "match-adapt"
    if (props.schFlex) return "flex"
    if (props.schGrid) return "grid"
    if (props.matchAdapt) return "match-adapt"
    if (props.flex) return "flex"
    if (props.grid) return "grid"
    if (props.relative) return "relative"
    if (props.schRelative) return "relative"
    // If no layout method has been defined, fall back to match-adapt
    // unless any direct layout child defines schX or schY.
    // Schematic primitives (e.g. schematictext) can have explicit coordinates
    // without opting the entire group out of auto layout.
    const anyLayoutChildHasSchCoords = this.children.some((child) => {
      const cProps = (child as any)._parsedProps
      const participatesInAutoLayout =
        (child as any).source_component_id !== null ||
        (child as any).source_group_id !== null
      return (
        participatesInAutoLayout &&
        (cProps?.schX !== undefined || cProps?.schY !== undefined)
      )
    })
    const hasManualEdits =
      (props.manualEdits?.schematic_placements?.length ?? 0) > 0

    // For boards, schAutoLayoutEnabled should keep auto layout enabled for
    // unpositioned children even if some siblings have explicit schX/schY.
    // Explicitly positioned children are skipped by matchpack.
    if (schAutoLayoutEnabled && !hasManualEdits) return "match-adapt"

    // Use match-adapt if no explicit positioning is set, even with group
    // children. This allows nested groups to be laid out properly.
    if (!anyLayoutChildHasSchCoords && !hasManualEdits) return "match-adapt"
    return "relative"
  }

  doInitialSchematicLayout(): void {
    // The schematic_components are rendered in our children
    if (this._parsedProps.showAsSchematicBox) {
      this._insertSchematicBorder()
      return
    }

    const hasAnySectionName = this.children.some(
      (c) =>
        c.source_component_id !== null &&
        c._parsedProps?.schSectionName !== undefined,
    )
    const hasSections = hasAnySectionName
    if (hasSections) {
      this._doInitialSchematicLayoutSections()
      this._insertSchematicBorder()
      return
    }

    const schematicLayoutMode = this._getSchematicLayoutMode()

    if (schematicLayoutMode === "match-adapt") {
      this._doInitialSchematicLayoutMatchpack()
    }
    if (schematicLayoutMode === "grid") {
      this._doInitialSchematicLayoutGrid()
    }
    if (schematicLayoutMode === "flex") {
      this._doInitialSchematicLayoutFlex()
    }

    this._insertSchematicBorder()
  }

  _doInitialSchematicLayoutSections(): void {
    Group_doInitialSchematicLayoutSections(this as any)
  }

  _doInitialSchematicLayoutMatchAdapt(): void {
    Group_doInitialSchematicLayoutMatchAdapt(this as any)
  }

  _doInitialSchematicLayoutMatchpack(): void {
    Group_doInitialSchematicLayoutMatchPack(this as any)
  }

  _doInitialSchematicLayoutGrid(): void {
    Group_doInitialSchematicLayoutGrid(this)
  }

  _doInitialSchematicLayoutFlex(): void {
    Group_doInitialSchematicLayoutFlex(this as any)
  }

  _getPcbLayoutMode(): "grid" | "flex" | "match-adapt" | "pack" | "none" {
    const props = this._parsedProps as SubcircuitGroupProps
    const rawProps = this.props as any
    if (this._isInflatedFromCircuitJson) return "none"
    if (props.pcbRelative) return "none"
    if (props.pcbLayout?.matchAdapt) return "match-adapt"
    if (props.pcbLayout?.flex) return "flex"
    if (props.pcbLayout?.grid) return "grid"
    if (props.pcbLayout?.pack) return "pack"

    if (props.pcbFlex) return "flex"
    if (props.pcbGrid) return "grid"
    if (props.pcbPack) return "pack"
    if (props.pack) return "pack"
    if (props.matchAdapt) return "match-adapt"

    if (props.flex) return "flex"
    if (props.grid) return "grid"

    // Default to pcbPack when there are multiple direct children without explicit
    // pcb coordinates and no manual edits are present. Relatively positioned
    // components (with pcbX/pcbY) will be excluded from packing, while others
    // will be packed together.
    const groupHasCoords =
      props.pcbX !== undefined ||
      props.pcbY !== undefined ||
      props.pcbLeftEdgeX !== undefined ||
      props.pcbRightEdgeX !== undefined ||
      props.pcbTopEdgeY !== undefined ||
      props.pcbBottomEdgeY !== undefined ||
      rawProps.pcbLeftEdgeX !== undefined ||
      rawProps.pcbRightEdgeX !== undefined ||
      rawProps.pcbTopEdgeY !== undefined ||
      rawProps.pcbBottomEdgeY !== undefined
    const hasManualEdits = (props.manualEdits?.pcb_placements?.length ?? 0) > 0

    const unpositionedDirectChildrenCount = this.children.reduce(
      (count, child) => {
        // Skip net components - they don't have physical PCB components
        if (!child.pcb_component_id && !(child as Group).pcb_group_id) {
          return count
        }

        const childProps = child._parsedProps
        const rawChildProps = child.props as any
        const hasCoords =
          childProps?.pcbX !== undefined ||
          childProps?.pcbY !== undefined ||
          childProps?.pcbLeftEdgeX !== undefined ||
          childProps?.pcbRightEdgeX !== undefined ||
          childProps?.pcbTopEdgeY !== undefined ||
          childProps?.pcbBottomEdgeY !== undefined ||
          rawChildProps?.pcbLeftEdgeX !== undefined ||
          rawChildProps?.pcbRightEdgeX !== undefined ||
          rawChildProps?.pcbTopEdgeY !== undefined ||
          rawChildProps?.pcbBottomEdgeY !== undefined
        return count + (hasCoords ? 0 : 1)
      },
      0,
    )

    if (!hasManualEdits && unpositionedDirectChildrenCount > 1) return "pack"
    return "none"
  }

  doInitialPcbLayout(): void {
    if (this.root?.pcbDisabled) return

    // Position the group itself if pcbX/pcbY are provided
    if (this.pcb_group_id) {
      const { db } = this.root!
      const props = this._parsedProps

      const hasExplicitPcbPosition =
        props.pcbX !== undefined || props.pcbY !== undefined

      if (hasExplicitPcbPosition) {
        const parentGroup = this.parent?.getGroup?.()
        const pcbParentGroupId = parentGroup?.pcb_group_id
          ? db.pcb_group.get(parentGroup.pcb_group_id)?.pcb_group_id
          : undefined

        const positionedRelativeToBoardId = !pcbParentGroupId
          ? (this._getBoard()?.pcb_board_id ?? undefined)
          : undefined

        db.pcb_group.update(this.pcb_group_id, {
          position_mode: "relative_to_group_anchor",
          positioned_relative_to_pcb_group_id: pcbParentGroupId,
          positioned_relative_to_pcb_board_id: positionedRelativeToBoardId,
          display_offset_x: props.pcbX,
          display_offset_y: props.pcbY,
        })
      }
    }

    const pcbLayoutMode = this._getPcbLayoutMode()

    if (pcbLayoutMode === "grid") {
      this._doInitialPcbLayoutGrid()
    } else if (pcbLayoutMode === "pack") {
      this._doInitialPcbLayoutPack()
    } else if (pcbLayoutMode === "flex") {
      this._doInitialPcbLayoutFlex()
    }
  }

  _doInitialPcbLayoutGrid(): void {
    Group_doInitialPcbLayoutGrid(this)
  }

  _doInitialPcbLayoutPack(): void {
    Group_doInitialPcbLayoutPack(this as any)
  }

  _doInitialPcbLayoutFlex(): void {
    Group_doInitialPcbLayoutFlex(this as any)
  }

  _insertSchematicBorder() {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const props = this._parsedProps as SubcircuitGroupProps

    if (!props.border) return

    let width: number | undefined =
      typeof props.schWidth === "number" ? props.schWidth : undefined
    let height: number | undefined =
      typeof props.schHeight === "number" ? props.schHeight : undefined

    const paddingGeneral =
      typeof props.schPadding === "number" ? props.schPadding : 0
    const paddingLeft =
      typeof props.schPaddingLeft === "number"
        ? props.schPaddingLeft
        : paddingGeneral
    const paddingRight =
      typeof props.schPaddingRight === "number"
        ? props.schPaddingRight
        : paddingGeneral
    const paddingTop =
      typeof props.schPaddingTop === "number"
        ? props.schPaddingTop
        : paddingGeneral
    const paddingBottom =
      typeof props.schPaddingBottom === "number"
        ? props.schPaddingBottom
        : paddingGeneral

    const schematicGroup = this.schematic_group_id
      ? db.schematic_group.get(this.schematic_group_id)
      : null
    if (schematicGroup) {
      if (width === undefined && typeof schematicGroup.width === "number") {
        width = schematicGroup.width
      }
      if (height === undefined && typeof schematicGroup.height === "number") {
        height = schematicGroup.height
      }
    }

    if (width === undefined || height === undefined) return

    const center =
      schematicGroup?.center ?? this._getGlobalSchematicPositionBeforeLayout()

    const left = center.x - width / 2 - paddingLeft
    const bottom = center.y - height / 2 - paddingBottom

    const finalWidth = width + paddingLeft + paddingRight
    const finalHeight = height + paddingTop + paddingBottom

    db.schematic_box.insert({
      width: finalWidth,
      height: finalHeight,
      x: left,
      y: bottom,
      is_dashed: props.border?.dashed ?? false,
    })
  }

  _determineSideFromPosition(
    port: SchematicPort,
    component: SchematicComponent,
  ): "left" | "right" | "top" | "bottom" {
    if (!port.center || !component.center) return "left"

    const dx = port.center.x - component.center.x
    const dy = port.center.y - component.center.y

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left"
    }
    return dy > 0 ? "bottom" : "top"
  }

  _calculateSchematicBounds(
    boxes: Array<{ centerX: number; centerY: number }>,
  ): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    if (boxes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const box of boxes) {
      minX = Math.min(minX, box.centerX)
      maxX = Math.max(maxX, box.centerX)
      minY = Math.min(minY, box.centerY)
      maxY = Math.max(maxY, box.centerY)
    }

    // Add some padding
    const padding = 2
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    }
  }

  _getAutorouterConfig(): AutorouterConfig {
    const autorouter =
      this._parsedProps.autorouter || this.getInheritedProperty("autorouter")
    return getPresetAutoroutingConfig(autorouter, this.root?.platform)
  }

  _isLaserPrefabAutorouter(
    autorouterConfig: AutorouterConfig = this._getAutorouterConfig(),
  ): boolean {
    const autorouterProp = this.props.autorouter
    const normalize = (value?: string) => value?.replace(/-/g, "_") ?? value
    if (autorouterConfig.preset === "laser_prefab") return true
    if (typeof autorouterProp === "string") {
      return normalize(autorouterProp) === "laser_prefab"
    }
    if (typeof autorouterProp === "object" && autorouterProp) {
      return normalize(autorouterProp.preset) === "laser_prefab"
    }
    return false
  }

  _isAutoJumperAutorouter(
    autorouterConfig: AutorouterConfig = this._getAutorouterConfig(),
  ): boolean {
    const autorouterProp = this.props.autorouter
    const normalize = (value?: string) => value?.replace(/-/g, "_") ?? value
    if (autorouterConfig.preset === "auto_jumper") return true
    if (typeof autorouterProp === "string") {
      return normalize(autorouterProp) === "auto_jumper"
    }
    if (typeof autorouterProp === "object" && autorouterProp) {
      return normalize(autorouterProp.preset) === "auto_jumper"
    }
    return false
  }

  _getSubcircuitLayerCount(): number {
    const layers = this.getInheritedProperty("layers")
    return typeof layers === "number" ? layers : 2
  }
  /**
   * Trace-by-trace autorouting is where each trace routes itself in a well-known
   * order. It's the most deterministic way to autoroute, because a new trace
   * is generally ordered last.
   *
   * This method will return false if using an external service for autorouting
   * or if using a "fullview" or "rip and replace" autorouting mode
   */
  _shouldUseTraceByTraceRouting(): boolean {
    // Inherit from parent if not set by props
    const autorouter = this._getAutorouterConfig()
    return autorouter.groupMode === "sequential-trace"
  }

  doInitialPcbDesignRuleChecks() {
    if (this.root?.pcbDisabled) return
    if (
      this.root?.pcbRoutingDisabled ||
      this.getInheritedProperty("routingDisabled")
    )
      return
    const { db } = this.root!

    if (this.isSubcircuit) {
      const immediateChildrenByName = new Map<string, PrimitiveComponent[]>()

      for (const child of this.children) {
        // Nested subcircuits are scoped independently. All other immediate
        // children must have unique names unless same-named traces resolve to
        // the same underlying connectivity key.
        if ((child as any).isSubcircuit) continue

        if (child._parsedProps.name) {
          const components =
            immediateChildrenByName.get(child._parsedProps.name) || []
          components.push(child)
          immediateChildrenByName.set(child._parsedProps.name, components)
        }
      }

      for (const [name, components] of immediateChildrenByName.entries()) {
        if (components.length <= 1) continue

        const sameNamedTraces = components.filter(
          (child): child is Trace => child instanceof Trace,
        )
        const duplicateNameIsOnlyTraces =
          sameNamedTraces.length === components.length
        const mutuallyConnectedTraceKeys = sameNamedTraces.map(
          (trace) => trace.subcircuit_connectivity_map_key,
        )
        const sameNamedTracesAreMutuallyConnected =
          duplicateNameIsOnlyTraces &&
          mutuallyConnectedTraceKeys.every(Boolean) &&
          new Set(mutuallyConnectedTraceKeys).size === 1

        if (
          !duplicateNameIsOnlyTraces ||
          !sameNamedTracesAreMutuallyConnected
        ) {
          const displaySubcircuitName = this.name || "unnamed"
          const message = duplicateNameIsOnlyTraces
            ? `Trace "${name}" in subcircuit "${displaySubcircuitName}" shares a name with another trace, but the traces are not mutually connected. Same-named traces must have the same subcircuit connectivity map key.`
            : `Multiple immediate children found with name "${name}" in subcircuit "${displaySubcircuitName}". Names must be unique.`

          db.pcb_trace_error.insert({
            error_type: "pcb_trace_error",
            message,
            source_trace_id: "",
            pcb_trace_id: "",
            pcb_component_ids: components
              .map((c) => c.pcb_component_id!)
              .filter(Boolean),
            pcb_port_ids: [],
          })
        }
      }

      insertPcbTraceTooLongWarnings({
        db,
        subcircuitId: this.subcircuit_id!,
      })
    }
  }

  doInitialSchematicReplaceNetLabelsWithSymbols() {
    if (this.root?.schematicDisabled) return
    if (!this.isSubcircuit) return
    const { db } = this.root!

    // TODO remove when circuit-json-util supports subtree properly
    // const subtree = db.subtree({ subcircuit_id: this.subcircuit_id! })
    const subtree = db

    for (const nl of subtree.schematic_net_label.list()) {
      const net = subtree.source_net.get(nl.source_net_id)
      const text = nl.text || net?.name || ""

      if (nl.anchor_side === "top" && GROUND_NET_REGEX.test(text)) {
        subtree.schematic_net_label.update(nl.schematic_net_label_id, {
          symbol_name: "rail_down",
        })
        continue
      }

      if (nl.anchor_side === "bottom" && POWER_NET_REGEX.test(text)) {
        subtree.schematic_net_label.update(nl.schematic_net_label_id, {
          symbol_name: "rail_up",
        })
      }
    }
  }

  doInitialSimulationSpiceEngineRender() {
    Group_doInitialSimulationSpiceEngineRender(this)
  }

  /**
   * Override anchor alignment to handle group-specific logic
   */
  doInitialPcbComponentAnchorAlignment(): void {
    Group_doInitialPcbComponentAnchorAlignment(this)
  }

  updatePcbComponentAnchorAlignment(): void {
    this.doInitialPcbComponentAnchorAlignment()
  }

  doInitialPcbCalcPlacementResolution(): void {
    Group_doInitialPcbCalcPlacementResolution(this)
  }

  updatePcbCalcPlacementResolution(): void {
    this.doInitialPcbCalcPlacementResolution()
  }

  /**
   * Get the minimum flex container size for this group on PCB
   */
  _getMinimumFlexContainerSize() {
    return super._getMinimumFlexContainerSize()
  }

  /**
   * Reposition this group on the PCB to the specified coordinates
   */
  _repositionOnPcb(position: { x: number; y: number }) {
    return super._repositionOnPcb(position)
  }
}
