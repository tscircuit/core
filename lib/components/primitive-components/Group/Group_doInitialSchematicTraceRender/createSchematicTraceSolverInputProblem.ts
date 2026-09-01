import {
  getBoundFromCenteredRect,
  getBoundsCenter,
} from "@tscircuit/math-utils"
import {
  type InputChip,
  type InputProblem,
  type NetId,
  type SectionId,
  type TextBoxes,
} from "@tscircuit/schematic-trace-solver"
import type { SchematicComponent, SourceNet, SourceTrace } from "circuit-json"
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { convertFacingDirectionToElbowDirection } from "lib/utils/schematic/convertFacingDirectionToElbowDirection"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import type { NetLabel } from "../../NetLabel"
import { Port } from "../../Port"
import type { Trace } from "../../Trace/Trace"
import { Group } from "../Group"
import { applyInlineNetLabelEligibility } from "./applyInlineNetLabelEligibility"
import { createCanonicalSchematicNetLabelTextResolver } from "./createCanonicalSchematicNetLabelTextResolver"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import { getPortForSchematicSymbolPort } from "./getPortForSchematicSymbolPort"
import type { AxisDirection } from "./getSide"
import {
  type SchematicPortId,
  type SourcePortId,
  asSchematicPortId,
  asSourcePortId,
} from "./port-id-types"
import {
  isDirectConnectionEndpointOutsideSchematicScope,
  resolveNetLabelForPortMissingTrace,
} from "./resolveNetLabelForPortMissingTrace"
import { schematicTextToTextBox } from "./schematicTextToTextBounds"

const DEFAULT_MAX_MSP_PAIR_DISTANCE = 2.4
const SCHEMATIC_RAIL_NET_LABEL_HEIGHT = 0.42
type SchematicComponentId = SchematicComponent["schematic_component_id"]
type SubcircuitConnectivityMapKey = NonNullable<
  SourceTrace["subcircuit_connectivity_map_key"]
>

export type SolverInputContext = {
  inputProblem: InputProblem
  /**
   * Subcircuit connectivity map key to source_net
   * e.g.
   * Map(
   *   "unnamedsubcircuit52_connectivity_net2": {
   *     type: "source_net",
   *     source_net_id: "source_net_2",
   *     name: "V3_3",
   *     member_source_group_ids: [],
   *     subcircuit_id: "subcircuit_source_group_1",
   *     subcircuit_connectivity_map_key: "unnamedsubcircuit52_connectivity_net2",
   *   }, ...
   * )
   */
  connKeyToSourceNet: Map<string, SourceNet>

  /**
   * User net id to subcircuit connectivity key
   * e.g.
   * Map(
   *   "V3_3": "unnamedsubcircuit52_connectivity_net2",
   *   "GND": "unnamedsubcircuit52_connectivity_net3",
   *   ...
   * )
   */
  userNetIdToConnKey: Map<string, string>

  /** Exact source trace for each cross-scope port-only solver label. */
  crossScopeSourceTraceIdBySchematicPortIdAndNetId: Map<
    SchematicPortId,
    Map<NetId, SourceTrace["source_trace_id"]>
  >

  /**
   * Port-only solver label anchors to the source trace represented at that
   * schematic port when exactly one in-scope source trace owns the port.
   */
  sourceTraceIdByPortOnlyLabelSchematicPortId: Map<
    SchematicPortId,
    SourceTrace["source_trace_id"]
  >

  /**
   * Subcircuit connectivity map keys that came from explicit port-to-net traces,
   * e.g. <trace from=".D1 > .pin1" to="net.VCC" />.
   */
  connKeysWithExplicitPortNetTraces: Set<string>

  schematicPortIdsInScope: Set<SchematicPortId>
  /**
   * Local schematic ports whose source port is also represented in the
   * subcircuit pass that owns their port-to-net trace.
   */
  schematicPortIdsWithExternallyRoutedRepresentations: Set<SchematicPortId>
  schPortIdToSourcePortId: Map<SchematicPortId, SourcePortId>
  netLabelsInScope: NetLabel[]

  /**
   * Solver pin pair (sorted schematic port ids joined by "::") to the
   * source_trace_id it was derived from.
   */
  sourceTraceIdByPinPairKey: Map<string, SourceTrace["source_trace_id"]>
}

export function createSchematicTraceSolverInputProblem(
  group: Group<any>,
  opts: { schematicSheetId?: string; netLabels?: NetLabel[] } = {},
): SolverInputContext {
  const { db } = group.root!

  const sourcePortConnectivityMap = getSourcePortConnectivityMapFromCircuitJson(
    db.toArray(),
  )
  // Subcircuit connectivity keys are local to their owning subcircuit, so the
  // same electrical net can have different keys on opposite sides of a
  // boundary. Derive one display-independent solver ID from the full source
  // connectivity network instead.
  const getStableSourceConnectivityNetId = (
    connectivityNetId: string,
  ): NetId => {
    const canonicalSourceId = [
      ...sourcePortConnectivityMap.getIdsConnectedToNet(connectivityNetId),
    ].sort()[0]

    return canonicalSourceId
      ? `source_connectivity_${canonicalSourceId}`
      : `source_${connectivityNetId}`
  }
  const getSourceConnectivityNetId = (sourceTrace: SourceTrace): NetId => {
    const connectivityNetId = [
      ...sourceTrace.connected_source_port_ids,
      ...sourceTrace.connected_source_net_ids,
    ]
      .map((sourceId) =>
        sourcePortConnectivityMap.getNetConnectedToId(sourceId),
      )
      .find((netId): netId is string => Boolean(netId))

    return connectivityNetId
      ? getStableSourceConnectivityNetId(connectivityNetId)
      : (sourceTrace.subcircuit_connectivity_map_key ??
          sourceTrace.source_trace_id)
  }
  const powerOrGroundSourceConnectivityNetIds = new Set<NetId>()
  for (const sourceNet of db.source_net.list()) {
    if (!sourceNet.is_power && !sourceNet.is_ground) continue
    const connectivityNetId = sourcePortConnectivityMap.getNetConnectedToId(
      sourceNet.source_net_id,
    )
    if (connectivityNetId) {
      powerOrGroundSourceConnectivityNetIds.add(
        getStableSourceConnectivityNetId(connectivityNetId),
      )
    }
  }

  const connKeyToSourceNet = new Map<string, SourceNet>()

  // Gather all schematic components in scope (this group and child groups)
  const childGroups: Group<any>[] = []
  const componentsToVisit = [...group.children].reverse()
  while (componentsToVisit.length > 0) {
    const child = componentsToVisit.pop()!
    if (child instanceof Group) {
      if (child.isSubcircuit) {
        if (child._parsedProps.showAsSchematicBox) childGroups.push(child)
        continue
      }

      childGroups.push(child)
    }

    componentsToVisit.push(...[...child.children].reverse())
  }
  const allSchematicGroupIds = [
    group.schematic_group_id,
    ...childGroups.map((a) => a.schematic_group_id),
  ]

  const schematicComponents = db.schematic_component
    .list()
    .filter((component) =>
      allSchematicGroupIds.includes(component.schematic_group_id!),
    )
    .filter(
      (component) =>
        opts.schematicSheetId === undefined ||
        component.schematic_sheet_id === opts.schematicSheetId,
    )
  const schematicComponentIds = new Set(
    schematicComponents.map((component) => component.schematic_component_id),
  )
  const schematicComponentsById = new Map(
    schematicComponents.map((component) => [
      component.schematic_component_id,
      component,
    ]),
  )
  const textBoxes = db.schematic_text
    .list()
    .filter(
      (text) =>
        text.schematic_component_id &&
        schematicComponentIds.has(text.schematic_component_id),
    )
    .map((text) => {
      const schematicComponent = schematicComponentsById.get(
        text.schematic_component_id!,
      )
      if (!schematicComponent) return
      const sourceComponent = db.source_component.get(
        schematicComponent.source_component_id!,
      )

      return schematicTextToTextBox(text, {
        schematicComponent,
        sourceComponent,
      })
    })
    .filter((textBox): textBox is TextBoxes => Boolean(textBox))

  const sectionIdBySchematicComponentId = new Map<
    SchematicComponentId,
    SectionId
  >()
  const boardDescendants = group._getBoard()?.getDescendants() ?? []
  for (const component of boardDescendants) {
    const schematicComponentId = component.schematic_component_id
    const sectionId = component.getSchematicSectionName()
    if (schematicComponentId && sectionId) {
      sectionIdBySchematicComponentId.set(schematicComponentId, sectionId)
    }
  }

  // Solver pin ids are schematic port ids because a source port can have
  // multiple schematic representations.
  const chips: InputChip[] = []

  for (const schematicComponent of schematicComponents) {
    const chipId = schematicComponent.schematic_component_id

    const schematicPorts = db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })

    const pins = schematicPorts.map((schematicPort) => {
      const schematicPortId = asSchematicPortId(schematicPort.schematic_port_id)
      const sourcePort = schematicPort.source_port_id
        ? db.source_port.get(schematicPort.source_port_id)
        : undefined
      return {
        pinId: schematicPortId,
        displayName:
          schematicPort.display_pin_label ??
          schematicPort.pin_number?.toString() ??
          sourcePort?.name,
        x: schematicPort.center.x,
        y: schematicPort.center.y,
        // Pass the port's true facing direction (known from the schematic
        // symbol). The chip box handed to the solver is text-inclusive, so for
        // small parts with a large reference designator the pins sit inside the
        // box. The solver snaps such pins to the box edge along this facing
        // direction (rather than guessing from geometry, which would pick the
        // wrong edge for a resistor whose ref text widened the box).
        _facingDirection: convertFacingDirectionToElbowDirection(
          schematicPort.facing_direction ?? null,
        ),
      }
    })

    const sectionId = sectionIdBySchematicComponentId.get(
      schematicComponent.schematic_component_id,
    )

    const layoutBounds =
      getSchematicComponentWithTextBounds({ db, schematicComponent }) ??
      getBoundFromCenteredRect({
        center: schematicComponent.center,
        width: schematicComponent.size.width,
        height: schematicComponent.size.height,
      })

    chips.push({
      chipId,
      center: getBoundsCenter(layoutBounds),
      width: layoutBounds.maxX - layoutBounds.minX,
      height: layoutBounds.maxY - layoutBounds.minY,
      pins,
      sectionId,
    })
  }

  // Maps for ports within this scope
  const schematicPortIdsInScope = new Set<SchematicPortId>()
  const schPortIdToSourcePortId = new Map<SchematicPortId, SourcePortId>()
  const sourcePortIdToSchPortId = new Map<SourcePortId, SchematicPortId>()
  const userNetIdToConnKey = new Map<string, string>()
  const componentPortBySchematicPortId = new Map<SchematicPortId, Port>(
    group
      .selectAll<Port>("port")
      .filter((port) => port.schematic_port_id)
      .map((port) => [asSchematicPortId(port.schematic_port_id!), port]),
  )
  const resolveCanonicalNetLabelText =
    createCanonicalSchematicNetLabelTextResolver(group)
  for (const sc of schematicComponents) {
    const ports = db.schematic_port.list({
      schematic_component_id: sc.schematic_component_id,
    })
    for (const sp of ports) {
      const schematicPortId = asSchematicPortId(sp.schematic_port_id)
      schematicPortIdsInScope.add(schematicPortId)
      if (sp.source_port_id) {
        const sourcePortId = asSourcePortId(sp.source_port_id)
        schPortIdToSourcePortId.set(schematicPortId, sourcePortId)
        sourcePortIdToSchPortId.set(sourcePortId, schematicPortId)
      }
    }
  }
  const sourcePortIdsInSchematicScope = new Set(sourcePortIdToSchPortId.keys())
  const netLabelsInScope = (opts.netLabels ?? []).filter((netLabel) =>
    netLabel._getConnectedPorts().some((port) => {
      if (!port.schematic_port_id) return false
      return schematicPortIdsInScope.has(
        asSchematicPortId(port.schematic_port_id),
      )
    }),
  )
  const schematicPortIdsWithExplicitNetLabels = new Set(
    netLabelsInScope
      .filter((netLabel) => !netLabel._parsedProps.inline)
      .flatMap((netLabel) => netLabel._getConnectedPorts())
      .map((port) => port.schematic_port_id)
      .filter(
        (schematicPortId): schematicPortId is SchematicPortId =>
          schematicPortId !== null && schematicPortId !== undefined,
      )
      .map(asSchematicPortId),
  )
  const solverManagedNetLabelSchematicPortIds = new Set(
    netLabelsInScope
      .filter(
        (netLabel) =>
          netLabel._parsedProps.inline ||
          (netLabel._parsedProps.schX === undefined &&
            netLabel._parsedProps.schY === undefined),
      )
      .flatMap((netLabel) => netLabel._getConnectedPorts())
      .map((port) => port.schematic_port_id)
      .filter(
        (schematicPortId): schematicPortId is SchematicPortId =>
          schematicPortId !== null && schematicPortId !== undefined,
      )
      .map(asSchematicPortId),
  )
  const schematicPortIdsWithInlineNetLabels = new Set(
    netLabelsInScope
      .filter((netLabel) => netLabel._parsedProps.inline)
      .flatMap((netLabel) => netLabel._getConnectedPorts())
      .map((port) => port.schematic_port_id)
      .filter(
        (schematicPortId): schematicPortId is SchematicPortId =>
          schematicPortId !== null && schematicPortId !== undefined,
      )
      .map(asSchematicPortId),
  )

  // Determine allowed subcircuits (this group and its child groups)
  const allowedSubcircuitIds = new Set<string>()
  if (group.subcircuit_id) allowedSubcircuitIds.add(group.subcircuit_id)
  for (const cg of childGroups) {
    if (cg.subcircuit_id) allowedSubcircuitIds.add(cg.subcircuit_id)
  }

  // Find all traces that are either in this subcircuit or connected to ports
  // within this subcircuit. This is necessary for traces that cross subcircuit
  // boundaries.
  const tracesInScope = db.source_trace.list().filter((st) => {
    if (st.subcircuit_id === group.subcircuit_id) return true
    for (const source_port_id of st.connected_source_port_ids) {
      if (sourcePortIdToSchPortId.has(asSourcePortId(source_port_id))) {
        return true
      }
    }
    return false
  })
  const traceComponentBySourceTraceId = new Map(
    group
      .selectAll<Trace>("trace")
      .filter((trace) => trace.source_trace_id)
      .map((trace) => [trace.source_trace_id!, trace]),
  )

  // A port-to-net trace owned by another subcircuit may target another
  // schematic representation of the same source port (for example, a
  // schematicbox in the parent). Only exclude the local representation in
  // that case. If there is no alternate representation, this local port still
  // needs a net label to show the cross-subcircuit connection.
  const schematicPortIdsWithExternallyRoutedRepresentations =
    new Set<SchematicPortId>()
  for (const sourceTrace of tracesInScope) {
    if (sourceTrace.subcircuit_id === group.subcircuit_id) continue
    if (sourceTrace.connected_source_net_ids.length === 0) continue

    for (const sourcePortId of sourceTrace.connected_source_port_ids) {
      const typedSourcePortId = asSourcePortId(sourcePortId)
      const schematicPortId = sourcePortIdToSchPortId.get(typedSourcePortId)
      if (!schematicPortId) continue
      if (solverManagedNetLabelSchematicPortIds.has(schematicPortId)) continue

      const hasAnotherRepresentationOnSheet = db.schematic_port
        .list({ source_port_id: sourcePortId })
        .some((port) => {
          if (port.schematic_port_id === schematicPortId) return false
          const component = port.schematic_component_id
            ? db.schematic_component.get(port.schematic_component_id)
            : undefined
          return component?.schematic_sheet_id === opts.schematicSheetId
        })
      if (!hasAnotherRepresentationOnSheet) continue

      schematicPortIdsWithExternallyRoutedRepresentations.add(schematicPortId)
    }
  }

  const externalNetIds = tracesInScope.flatMap(
    (st) => st.connected_source_net_ids,
  )

  for (const netId of externalNetIds) {
    const net = db.source_net.get(netId)
    if (net?.subcircuit_id) {
      allowedSubcircuitIds.add(net.subcircuit_id)
    }
  }

  for (const net of db.source_net
    .list()
    .filter(
      (sourceNet) =>
        !sourceNet.subcircuit_id ||
        allowedSubcircuitIds.has(sourceNet.subcircuit_id),
    )) {
    if (net.subcircuit_connectivity_map_key) {
      connKeyToSourceNet.set(net.subcircuit_connectivity_map_key, net)
    }
  }

  // Direct connections derived from explicit source_traces
  const directConnections: Array<{
    schematicPortIds: [SchematicPortId, SchematicPortId]
    netId?: string
    netLabelWidth?: number
    allowInlineNetLabel?: boolean
    inlineNetLabelWidth?: number
    inlineNetLabelHeight?: number
    /**
     * Retained only to decide inline-label eligibility below; stripped before
     * the problem is handed to the solver.
     */
    connKey?: string
    /**
     * Exact text explicitly assigned to this source-trace branch. Retained for
     * inline-label eligibility and stripped at the solver boundary.
     */
    explicitInlineNetLabelText?: string
  }> = []
  const boundaryTraceNetConnections: Array<{
    netId: string
    netLabelText?: string
    schematicPortIds: SchematicPortId[]
    netLabelWidth: number
    anchoredNetLabelWidth?: number
    allowInlineNetLabel?: boolean
    inlineNetLabelWidth?: number
    inlineNetLabelHeight?: number
    /** Retained for inline-label eligibility; stripped at the solver boundary. */
    connKey?: string
    /** Retained for inline-label eligibility; stripped at the solver boundary. */
    isSameSheetCrossSectionConnection?: boolean
    /** Retained for inline-label eligibility; stripped at the solver boundary. */
    isPowerOrGroundConnection?: boolean
  }> = []
  const connectedPairKeys = new Set<string>()
  const crossScopeSourceTraceIdBySchematicPortIdAndNetId = new Map<
    SchematicPortId,
    Map<NetId, SourceTrace["source_trace_id"]>
  >()
  const crossSectionNetConnectionByKey = new Map<
    NetId,
    (typeof boundaryTraceNetConnections)[number]
  >()
  const setCrossScopeSourceTraceId = ({
    schematicPortId,
    netId,
    sourceTraceId,
    replaceExisting = false,
  }: {
    schematicPortId: SchematicPortId
    netId: NetId
    sourceTraceId: SourceTrace["source_trace_id"]
    replaceExisting?: boolean
  }) => {
    const sourceTraceIdByNetId =
      crossScopeSourceTraceIdBySchematicPortIdAndNetId.get(schematicPortId) ??
      new Map<NetId, SourceTrace["source_trace_id"]>()
    if (sourceTraceIdByNetId.has(netId) && !replaceExisting) return false

    sourceTraceIdByNetId.set(netId, sourceTraceId)
    crossScopeSourceTraceIdBySchematicPortIdAndNetId.set(
      schematicPortId,
      sourceTraceIdByNetId,
    )
    return true
  }
  const addPortToCrossSectionInlineNetConnection = ({
    sourceConnectivityNetId,
    schematicPortId,
    text,
    sourceTraceId,
    connKey,
    preferInScopeTraceMetadata = false,
  }: {
    sourceConnectivityNetId: NetId
    schematicPortId: SchematicPortId
    text: string
    sourceTraceId: SourceTrace["source_trace_id"]
    connKey?: SubcircuitConnectivityMapKey
    preferInScopeTraceMetadata?: boolean
  }) => {
    const netId = sourceConnectivityNetId
    setCrossScopeSourceTraceId({
      schematicPortId,
      netId,
      sourceTraceId,
      replaceExisting: preferInScopeTraceMetadata,
    })
    if (schematicPortIdsWithExplicitNetLabels.has(schematicPortId)) return

    let connection = crossSectionNetConnectionByKey.get(sourceConnectivityNetId)
    if (!connection) {
      connection = {
        netId,
        netLabelText: text,
        schematicPortIds: [],
        netLabelWidth: Number(
          getSchematicNetLabelTextWidth({ text }).toFixed(2),
        ),
        connKey,
        isSameSheetCrossSectionConnection: true,
        isPowerOrGroundConnection:
          powerOrGroundSourceConnectivityNetIds.has(netId),
      }
      crossSectionNetConnectionByKey.set(sourceConnectivityNetId, connection)
      boundaryTraceNetConnections.push(connection)
    } else if (preferInScopeTraceMetadata) {
      // A boundary continuation and an in-scope cross-section trace can share
      // this electrical net and port. The in-scope trace owns the label shown
      // in this solver pass, independent of source-trace iteration order.
      connection.netLabelText = text
      connection.netLabelWidth = Number(
        getSchematicNetLabelTextWidth({ text }).toFixed(2),
      )
      connection.connKey = connKey ?? connection.connKey
    }

    if (!connection.schematicPortIds.includes(schematicPortId)) {
      connection.schematicPortIds.push(schematicPortId)
    }
  }
  const sourceTraceIdsByPortOnlyLabelSchematicPortId = new Map<
    SchematicPortId,
    Set<SourceTrace["source_trace_id"]>
  >()
  /**
   * Solver pin pair (sorted, "::"-joined) to the source trace it came from, so
   * a placement the solver hands back can be traced to its source_trace.
   */
  const sourceTraceIdByPinPairKey = new Map<
    string,
    SourceTrace["source_trace_id"]
  >()
  const connKeysWithExplicitPortNetTraces = new Set<string>()
  for (const sourceTrace of tracesInScope) {
    if (
      sourceTrace?.subcircuit_connectivity_map_key &&
      (sourceTrace.connected_source_port_ids?.length ?? 0) > 0 &&
      (sourceTrace.connected_source_net_ids?.length ?? 0) > 0
    ) {
      connKeysWithExplicitPortNetTraces.add(
        sourceTrace.subcircuit_connectivity_map_key,
      )
    }
  }

  const areSchematicPortsInDifferentSectionsOnSameSheet = (
    firstSchematicPortId: SchematicPortId,
    secondSchematicPortId: SchematicPortId,
  ) => {
    const firstSchematicPort = db.schematic_port.get(firstSchematicPortId)
    const secondSchematicPort = db.schematic_port.get(secondSchematicPortId)
    if (!firstSchematicPort || !secondSchematicPort) return false

    const sharesSheet =
      firstSchematicPort.schematic_sheet_id ===
      secondSchematicPort.schematic_sheet_id
    if (!sharesSheet) return false

    const firstSectionId = firstSchematicPort.schematic_component_id
      ? sectionIdBySchematicComponentId.get(
          firstSchematicPort.schematic_component_id,
        )
      : undefined
    const secondSectionId = secondSchematicPort.schematic_component_id
      ? sectionIdBySchematicComponentId.get(
          secondSchematicPort.schematic_component_id,
        )
      : undefined
    const crossesSection =
      firstSectionId !== secondSectionId &&
      (firstSectionId !== undefined || secondSectionId !== undefined)

    return crossesSection
  }

  const doesSourcePortCrossSectionOnSameSheet = ({
    schematicPortId,
    otherSourcePortId,
  }: {
    schematicPortId: SchematicPortId
    otherSourcePortId: SourcePortId
  }) =>
    db.schematic_port
      .list({ source_port_id: otherSourcePortId })
      .some((otherSchematicPort) =>
        areSchematicPortsInDifferentSectionsOnSameSheet(
          schematicPortId,
          asSchematicPortId(otherSchematicPort.schematic_port_id),
        ),
      )

  for (const st of tracesInScope) {
    const connected = (st.connected_source_port_ids ?? [])
      .map((sourcePortId) =>
        sourcePortIdToSchPortId.get(asSourcePortId(sourcePortId)),
      )
      .filter(
        (schematicPortId): schematicPortId is SchematicPortId =>
          Boolean(schematicPortId) &&
          schematicPortIdsInScope.has(schematicPortId!),
      )

    const sourcePortIdForSingleConnectedEndpoint =
      connected.length === 1
        ? schPortIdToSourcePortId.get(connected[0])
        : undefined
    const otherSourcePortId = sourcePortIdForSingleConnectedEndpoint
      ? st.connected_source_port_ids
          .map(asSourcePortId)
          .find(
            (sourcePortId) =>
              sourcePortId !== sourcePortIdForSingleConnectedEndpoint,
          )
      : undefined
    const crossesSchematicScopeBoundary = Boolean(
      sourcePortIdForSingleConnectedEndpoint &&
        otherSourcePortId &&
        isDirectConnectionEndpointOutsideSchematicScope({
          db,
          sourcePortId: sourcePortIdForSingleConnectedEndpoint,
          otherSourcePortId,
          sourcePortIdsInSchematicScope,
          schematicSheetId: opts.schematicSheetId,
        }),
    )
    const crossesSchematicSectionOnSameSheet = Boolean(
      connected.length === 1 &&
        otherSourcePortId &&
        doesSourcePortCrossSectionOnSameSheet({
          schematicPortId: connected[0]!,
          otherSourcePortId,
        }),
    )

    if (
      connected.length === 1 &&
      st.connected_source_port_ids.length === 2 &&
      crossesSchematicScopeBoundary &&
      st.connected_source_net_ids.length === 0 &&
      st.subcircuit_connectivity_map_key
    ) {
      const schematicPortId = connected[0]
      const sourcePortId = schPortIdToSourcePortId.get(schematicPortId)
      if (sourcePortId) {
        const connKey = st.subcircuit_connectivity_map_key
        const sourcePortConnKey =
          db.source_port.get(sourcePortId)?.subcircuit_connectivity_map_key
        const sourceNetInCurrentSubcircuit = db.source_net
          .list()
          .find(
            (sourceNet) =>
              sourceNet.subcircuit_id === group.subcircuit_id &&
              sourcePortConnectivityMap.areIdsConnected(
                sourceNet.source_net_id,
                sourcePortId,
              ),
          )
        const sourceNetForLabel =
          connKeyToSourceNet.get(connKey) ??
          (sourcePortConnKey
            ? connKeyToSourceNet.get(sourcePortConnKey)
            : undefined) ??
          sourceNetInCurrentSubcircuit
        const connectedSourcePortIdsForKey = Array.from(schematicPortIdsInScope)
          .map((portId) => schPortIdToSourcePortId.get(portId))
          .filter((sourcePortId): sourcePortId is SourcePortId => {
            if (!sourcePortId) return false
            return (
              db.source_port.get(sourcePortId)
                ?.subcircuit_connectivity_map_key === connKey
            )
          })
        const { text } = resolveNetLabelForPortMissingTrace({
          group,
          sourcePortId,
          connectedSourcePortIdsForKey,
          sourcePortIdsInSchematicScope,
          schematicSheetId: opts.schematicSheetId,
          connKey,
          sourceNet: sourceNetForLabel,
        })
        if (text) {
          const sourceConnectivityNetId = getSourceConnectivityNetId(st)
          if (!userNetIdToConnKey.has(sourceConnectivityNetId)) {
            userNetIdToConnKey.set(sourceConnectivityNetId, connKey)
          }
          if (crossesSchematicSectionOnSameSheet) {
            addPortToCrossSectionInlineNetConnection({
              sourceConnectivityNetId,
              schematicPortId,
              text,
              sourceTraceId: st.source_trace_id,
              connKey,
            })
          } else if (
            setCrossScopeSourceTraceId({
              schematicPortId,
              netId: sourceConnectivityNetId,
              sourceTraceId: st.source_trace_id,
            })
          ) {
            boundaryTraceNetConnections.push({
              netId: sourceConnectivityNetId,
              netLabelText: text,
              schematicPortIds: [schematicPortId],
              netLabelWidth: Number(
                getSchematicNetLabelTextWidth({ text }).toFixed(2),
              ),
              connKey,
            })
          }
        }
      }
    } else if (connected.length >= 2) {
      for (const schematicPortId of connected) {
        const sourceTraceIds =
          sourceTraceIdsByPortOnlyLabelSchematicPortId.get(schematicPortId) ??
          new Set<SourceTrace["source_trace_id"]>()
        sourceTraceIds.add(st.source_trace_id)
        sourceTraceIdsByPortOnlyLabelSchematicPortId.set(
          schematicPortId,
          sourceTraceIds,
        )
      }
      const traceLabel = st.name ?? st.display_name
      const userNetId = traceLabel ?? st.source_trace_id
      if (st.subcircuit_connectivity_map_key) {
        userNetIdToConnKey.set(userNetId, st.subcircuit_connectivity_map_key)
      }
      const maxMspDist =
        group._parsedProps.schMaxTraceDistance ?? DEFAULT_MAX_MSP_PAIR_DISTANCE
      const portsForConnection = connected
        .map((schematicPortId) =>
          componentPortBySchematicPortId.get(schematicPortId),
        )
        .filter((port): port is Port => Boolean(port))
      const renderedNetLabelText = st.subcircuit_connectivity_map_key
        ? resolveCanonicalNetLabelText({
            subcircuitConnectivityMapKey: st.subcircuit_connectivity_map_key,
          }).name
        : getNetNameFromPorts(portsForConnection).name || traceLabel
      const shouldRenderNetLabels = connected.slice(1).some((b, index) => {
        const a = connected[index]
        const portA = db.schematic_port.get(a)
        const portB = db.schematic_port.get(b)
        if (!portA || !portB) return false
        return (
          Math.sqrt(
            (portA.center.x - portB.center.x) ** 2 +
              (portA.center.y - portB.center.y) ** 2,
          ) > maxMspDist
        )
      })
      const netLabelWidth =
        renderedNetLabelText && shouldRenderNetLabels
          ? Number(
              getSchematicNetLabelTextWidth({
                text: renderedNetLabelText,
              }).toFixed(2),
            )
          : undefined
      const explicitInlineNetLabelText =
        connected.length > 2
          ? traceComponentBySourceTraceId.get(st.source_trace_id)?._parsedProps
              .schDisplayLabel
          : undefined
      const crossSectionNetLabelText = renderedNetLabelText

      // The schematic solver accepts two-terminal direct connections. Expand
      // the ordered source trace path into adjacent edges that share one net ID
      // so its connectivity map retains every terminal as a single net. An
      // explicit display label belongs to the first branch in that ordered
      // path; duplicating it on every expanded edge would repeat the text.
      for (let i = 0; i < connected.length - 1; i++) {
        const a = connected[i]
        const b = connected[i + 1]
        const pairKey = [a, b].sort().join("::")
        if (connectedPairKeys.has(pairKey)) continue
        connectedPairKeys.add(pairKey)

        if (
          crossSectionNetLabelText &&
          areSchematicPortsInDifferentSectionsOnSameSheet(a, b)
        ) {
          const sourceConnectivityNetId = getSourceConnectivityNetId(st)
          if (st.subcircuit_connectivity_map_key) {
            userNetIdToConnKey.set(
              sourceConnectivityNetId,
              st.subcircuit_connectivity_map_key,
            )
          }
          addPortToCrossSectionInlineNetConnection({
            sourceConnectivityNetId,
            schematicPortId: a,
            text: crossSectionNetLabelText,
            sourceTraceId: st.source_trace_id,
            connKey: st.subcircuit_connectivity_map_key,
            preferInScopeTraceMetadata: true,
          })
          addPortToCrossSectionInlineNetConnection({
            sourceConnectivityNetId,
            schematicPortId: b,
            text: crossSectionNetLabelText,
            sourceTraceId: st.source_trace_id,
            connKey: st.subcircuit_connectivity_map_key,
            preferInScopeTraceMetadata: true,
          })
          continue
        }

        sourceTraceIdByPinPairKey.set(pairKey, st.source_trace_id)
        directConnections.push({
          schematicPortIds: [a, b],
          netId: userNetId,
          netLabelWidth,
          connKey: st.subcircuit_connectivity_map_key,
          explicitInlineNetLabelText:
            i === 0 ? explicitInlineNetLabelText : undefined,
        })
      }
    }
  }

  // Net connections derived from named nets (source_net) in-scope
  const netConnections: Array<{
    netId: string
    netLabelText?: string
    schematicPortIds: SchematicPortId[]
    isGround?: boolean
    netLabelWidth?: number
    netLabelHeight?: number
    allowInlineNetLabel?: boolean
    inlineNetLabelWidth?: number
    inlineNetLabelHeight?: number
    /** Retained for inline-label eligibility; stripped at the solver boundary. */
    connKey?: string
    /** Retained for inline-label eligibility; stripped at the solver boundary. */
    isSameSheetCrossSectionConnection?: boolean
    /** Retained for inline-label eligibility; stripped at the solver boundary. */
    isPowerOrGroundConnection?: boolean
  }> = [...boundaryTraceNetConnections]

  /**
   * Subcircuit connectivity map key to schematic port ids
   */
  const connKeyToSchematicPortIds = new Map<string, SchematicPortId[]>()
  for (const [schId, srcPortId] of schPortIdToSourcePortId) {
    if (schematicPortIdsWithExternallyRoutedRepresentations.has(schId)) continue
    const sp = db.source_port.get(srcPortId)
    if (!sp?.subcircuit_connectivity_map_key) continue
    const connKey = sp.subcircuit_connectivity_map_key
    if (!connKeyToSchematicPortIds.has(connKey)) {
      connKeyToSchematicPortIds.set(connKey, [])
    }
    connKeyToSchematicPortIds.get(connKey)!.push(schId)
  }

  for (const [connKey, schematicPortIds] of connKeyToSchematicPortIds) {
    const sourceNet = connKeyToSourceNet.get(connKey)
    if (sourceNet && schematicPortIds.length >= 1) {
      const seenRoutedSchematicPortIds = new Set<SchematicPortId>()
      const uniqueSchematicPortIds = schematicPortIds.filter(
        (schematicPortId) => {
          const componentPort =
            componentPortBySchematicPortId.get(schematicPortId)
          const routedSchematicPortIdValue = componentPort
            ? getPortForSchematicSymbolPort(componentPort).schematic_port_id
            : null
          const routedSchematicPortId = routedSchematicPortIdValue
            ? asSchematicPortId(routedSchematicPortIdValue)
            : schematicPortId
          if (seenRoutedSchematicPortIds.has(routedSchematicPortId)) {
            return false
          }
          seenRoutedSchematicPortIds.add(routedSchematicPortId)
          return true
        },
      )
      const userNetId = String(
        sourceNet.name || sourceNet.source_net_id || connKey,
      )
      userNetIdToConnKey.set(userNetId, connKey)

      const netLabelTextWidth = Number(
        getSchematicNetLabelTextWidth({ text: String(userNetId) }).toFixed(2),
      )

      // Signal nets: the label is horizontal, so the net-name text width is its
      // horizontal extent (netLabelWidth); the solver picks the height.
      let netLabelWidth = netLabelTextWidth
      let netLabelHeight: number | undefined

      // Power/ground nets render as vertical rail symbols (orientation y+/y-).
      // The solver rotates the label box for vertical labels, treating
      // netLabelHeight as the horizontal extent and netLabelWidth as the
      // vertical extent. So the horizontally-drawn net-name text (what traces
      // route through) is passed as netLabelHeight, and the fixed rail height
      // as netLabelWidth.
      if (sourceNet.is_ground || sourceNet.is_power) {
        netLabelWidth = SCHEMATIC_RAIL_NET_LABEL_HEIGHT
        netLabelHeight = netLabelTextWidth
      }

      netConnections.push({
        netId: userNetId,
        schematicPortIds: uniqueSchematicPortIds,
        isGround: sourceNet.is_ground,
        netLabelWidth,
        netLabelHeight,
        connKey,
      })
    }
  }

  applyInlineNetLabelEligibility({
    directConnections,
    netConnections,
    connKeyToSchematicPortIds,
    connKeyToSourceNet,
    connKeysWithExplicitPortNetTraces,
    schematicPortIdsWithExplicitNetLabels,
    schematicPortIdsWithInlineNetLabels,
    areSchematicPortsOnDifferentComponents: (schematicPortIds) => {
      const componentIds = schematicPortIds.map(
        (schematicPortId) =>
          db.schematic_port.get(schematicPortId)?.schematic_component_id,
      )
      return (
        componentIds.every((componentId): componentId is string =>
          Boolean(componentId),
        ) && componentIds[0] !== componentIds[1]
      )
    },
    resolveCanonicalNetLabelText,
  })

  // Available net label orientations from source_net naming conventions
  const availableNetLabelOrientations: Record<string, AxisDirection[]> =
    (() => {
      const netToAllowedOrientations: Record<string, AxisDirection[]> = {}
      const presentNetIds = new Set(netConnections.map((nc) => nc.netId))
      for (const net of db.source_net
        .list()
        .filter(
          (n) => !n.subcircuit_id || allowedSubcircuitIds.has(n.subcircuit_id),
        )) {
        if (!net.name) continue
        if (!presentNetIds.has(net.name)) continue
        if (net.is_ground) {
          netToAllowedOrientations[net.name] = ["y-"]
        } else if (net.is_power) {
          netToAllowedOrientations[net.name] = ["y+"]
        } else {
          netToAllowedOrientations[net.name] = ["x-", "x+"]
        }
      }
      for (const { netId } of boundaryTraceNetConnections) {
        netToAllowedOrientations[netId] ??= ["x-", "x+"]
      }
      return netToAllowedOrientations
    })()

  const inputProblem: InputProblem = {
    chips,
    directConnections: directConnections.map(
      ({
        schematicPortIds,
        connKey,
        explicitInlineNetLabelText,
        ...connection
      }) => ({
        ...connection,
        pinIds: schematicPortIds,
      }),
    ),
    netConnections: netConnections.map(
      ({
        schematicPortIds,
        connKey,
        isSameSheetCrossSectionConnection,
        isPowerOrGroundConnection,
        ...connection
      }) => ({
        ...connection,
        pinIds: schematicPortIds,
      }),
    ),
    textBoxes,
    availableNetLabelOrientations,
    maxMspPairDistance:
      group._parsedProps.schMaxTraceDistance ?? DEFAULT_MAX_MSP_PAIR_DISTANCE,
  }

  const sourceTraceIdByPortOnlyLabelSchematicPortId = new Map(
    Array.from(sourceTraceIdsByPortOnlyLabelSchematicPortId).flatMap(
      ([schematicPortId, sourceTraceIds]) => {
        if (sourceTraceIds.size !== 1) return []
        return [[schematicPortId, sourceTraceIds.values().next().value!]]
      },
    ),
  )

  return {
    inputProblem,
    connKeyToSourceNet,
    userNetIdToConnKey,
    crossScopeSourceTraceIdBySchematicPortIdAndNetId,
    sourceTraceIdByPortOnlyLabelSchematicPortId,
    connKeysWithExplicitPortNetTraces,
    schematicPortIdsInScope,
    schematicPortIdsWithExternallyRoutedRepresentations,
    schPortIdToSourcePortId,
    netLabelsInScope,
    sourceTraceIdByPinPairKey,
  }
}
