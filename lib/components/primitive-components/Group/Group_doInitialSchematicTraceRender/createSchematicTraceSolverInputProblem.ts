import {
  getBoundFromCenteredRect,
  getBoundsCenter,
} from "@tscircuit/math-utils"
import {
  type InputChip,
  type InputPin,
  type InputProblem,
  type SectionId,
  type TextBoxes,
} from "@tscircuit/schematic-trace-solver"
import type { SchematicComponent, SourceNet } from "circuit-json"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { convertFacingDirectionToElbowDirection } from "lib/utils/schematic/convertFacingDirectionToElbowDirection"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { Port } from "../../Port"
import { Group } from "../Group"
import { getNetLabelsInSchematicTraceScope } from "./getNetLabelsInSchematicTraceScope"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import { getPortForSchematicSymbolPort } from "./getPortForSchematicSymbolPort"
import type { AxisDirection } from "./getSide"
import {
  type SchematicPortId,
  type SourcePortId,
  asSchematicPortId,
  asSourcePortId,
} from "./port-id-types"
import { schematicTextToTextBox } from "./schematicTextToTextBounds"

const DEFAULT_MAX_MSP_PAIR_DISTANCE = 2.4
const SCHEMATIC_RAIL_NET_LABEL_HEIGHT = 0.42
type SchematicComponentId = SchematicComponent["schematic_component_id"]

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
}

export function createSchematicTraceSolverInputProblem(
  group: Group<any>,
  opts: { schematicSheetId?: string } = {},
): SolverInputContext {
  const { db } = group.root!

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
  for (const component of group.getDescendants()) {
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
    const pins: InputPin[] = []

    const schematicPorts = db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })

    for (const schematicPort of schematicPorts) {
      const schematicPortId = asSchematicPortId(schematicPort.schematic_port_id)
      pins.push({
        pinId: schematicPortId,
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
      })
    }

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
  const solverManagedNetLabelSchematicPortIds = new Set(
    getNetLabelsInSchematicTraceScope(group)
      .filter(
        (netLabel) =>
          netLabel._parsedProps.schX === undefined &&
          netLabel._parsedProps.schY === undefined,
      )
      .flatMap((netLabel) => netLabel._getConnectedPorts())
      .map((port) => port.schematic_port_id)
      .filter(
        (schematicPortId): schematicPortId is SchematicPortId =>
          schematicPortId !== null && schematicPortId !== undefined,
      )
      .map(asSchematicPortId),
  )
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

  // Direct connections derived from explicit source_traces
  const directConnections: Array<{
    schematicPortIds: [SchematicPortId, SchematicPortId]
    netId?: string
    netLabelWidth?: number
  }> = []
  const connectedPairKeys = new Set<string>()
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

  for (const st of db.source_trace.list()) {
    if (st.subcircuit_id && !allowedSubcircuitIds.has(st.subcircuit_id)) {
      continue
    }
    const connected = (st.connected_source_port_ids ?? [])
      .map((sourcePortId) =>
        sourcePortIdToSchPortId.get(asSourcePortId(sourcePortId)),
      )
      .filter(
        (schematicPortId): schematicPortId is SchematicPortId =>
          Boolean(schematicPortId) &&
          schematicPortIdsInScope.has(schematicPortId!),
      )

    if (connected.length >= 2) {
      const [a, b] = connected.slice(0, 2)
      const pairKey = [a, b].sort().join("::")
      if (!connectedPairKeys.has(pairKey)) {
        connectedPairKeys.add(pairKey)
        const traceLabel = st.name ?? st.display_name
        const userNetId = traceLabel ?? st.source_trace_id
        if (st.subcircuit_connectivity_map_key) {
          userNetIdToConnKey.set(userNetId, st.subcircuit_connectivity_map_key)
        }
        const portA = db.schematic_port.get(a)
        const portB = db.schematic_port.get(b)
        let portDistance = 0
        if (portA && portB) {
          portDistance = Math.sqrt(
            (portA.center.x - portB.center.x) ** 2 +
              (portA.center.y - portB.center.y) ** 2,
          )
        }
        const maxMspDist =
          group._parsedProps.schMaxTraceDistance ??
          DEFAULT_MAX_MSP_PAIR_DISTANCE
        const usesGeneratedTraceLabel =
          !traceLabel || traceLabel.startsWith(".")
        const portsForConnection = usesGeneratedTraceLabel
          ? [a, b]
              .map((schematicPortId) =>
                componentPortBySchematicPortId.get(schematicPortId),
              )
              .filter((port): port is Port => Boolean(port))
          : []
        const renderedNetLabelText = usesGeneratedTraceLabel
          ? getNetNameFromPorts(portsForConnection).name
          : traceLabel
        let netLabelWidth: number | undefined
        if (renderedNetLabelText && portDistance > maxMspDist) {
          netLabelWidth = Number(
            getSchematicNetLabelTextWidth(
              usesGeneratedTraceLabel
                ? { text: renderedNetLabelText }
                : { text: renderedNetLabelText, font_size: 0.14 },
            ).toFixed(2),
          )
        }
        directConnections.push({
          schematicPortIds: [a, b],
          netId: userNetId,
          netLabelWidth,
        })
      }
    }
  }

  // Net connections derived from named nets (source_net) in-scope
  const netConnections: Array<{
    netId: string
    schematicPortIds: SchematicPortId[]
    netLabelWidth?: number
    netLabelHeight?: number
  }> = []
  for (const net of db.source_net
    .list()
    .filter(
      (n) => !n.subcircuit_id || allowedSubcircuitIds.has(n.subcircuit_id!),
    )) {
    if (net.subcircuit_connectivity_map_key) {
      connKeyToSourceNet.set(net.subcircuit_connectivity_map_key, net)
    }
  }

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
        netLabelWidth,
        netLabelHeight,
      })
    }
  }

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
      return netToAllowedOrientations
    })()

  const inputProblem: InputProblem = {
    chips,
    directConnections: directConnections.map(
      ({ schematicPortIds, ...connection }) => ({
        ...connection,
        pinIds: schematicPortIds,
      }),
    ),
    netConnections: netConnections.map(
      ({ schematicPortIds, ...connection }) => ({
        ...connection,
        pinIds: schematicPortIds,
      }),
    ),
    textBoxes,
    availableNetLabelOrientations,
    maxMspPairDistance:
      group._parsedProps.schMaxTraceDistance ?? DEFAULT_MAX_MSP_PAIR_DISTANCE,
  }

  return {
    inputProblem,
    connKeyToSourceNet,
    userNetIdToConnKey,
    connKeysWithExplicitPortNetTraces,
    schematicPortIdsInScope,
    schematicPortIdsWithExternallyRoutedRepresentations,
    schPortIdToSourcePortId,
  }
}
