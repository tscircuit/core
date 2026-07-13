import {
  getBoundFromCenteredRect,
  getBoundsCenter,
} from "@tscircuit/math-utils"
import {
  type InputChip,
  type InputPin,
  type InputProblem,
  type TextBoxes,
} from "@tscircuit/schematic-trace-solver"
import type { SourceNet } from "circuit-json"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { convertFacingDirectionToElbowDirection } from "lib/utils/schematic/convertFacingDirectionToElbowDirection"
import { Group } from "../Group"
import type { AxisDirection } from "./getSide"
import { schematicTextToTextBox } from "./schematicTextToTextBounds"
import { getSchematicPortSelector } from "./getSchematicPortSelector"

const DEFAULT_MAX_MSP_PAIR_DISTANCE = 2.4
const SCHEMATIC_RAIL_NET_LABEL_HEIGHT = 0.42

export type SolverInputContext = {
  inputProblem: InputProblem
  pinIdToSchematicPortId: Map<string, string>
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

  allSourceAndSchematicPortIdsInScope: Set<string>
  schPortIdToSourcePortId: Map<string, string>
}

export function createSchematicTraceSolverInputProblem(
  group: Group<any>,
): SolverInputContext {
  const { db } = group.root!

  const connKeyToSourceNet = new Map<string, SourceNet>()

  // Gather all schematic components in scope (this group and child groups)
  const childGroups = group.selectAll("group") as Group<any>[]
  const allSchematicGroupIds = [
    group.schematic_group_id,
    ...childGroups.map((a) => a.schematic_group_id),
  ]

  const sourcePortIdsReferencedByGroupTraces = new Set(
    db.source_trace
      .list()
      .filter((trace) => trace.subcircuit_id === group.subcircuit_id)
      .flatMap((trace) => trace.connected_source_port_ids),
  )
  const schematicComponentIdsReferencedByGroupTraces = new Set(
    db.schematic_port
      .list()
      .filter(
        (port) =>
          port.source_port_id &&
          sourcePortIdsReferencedByGroupTraces.has(port.source_port_id),
      )
      .map((port) => port.schematic_component_id),
  )

  const schematicComponents = db.schematic_component
    .list()
    .filter(
      (component) =>
        allSchematicGroupIds.includes(component.schematic_group_id!) ||
        (schematicComponentIdsReferencedByGroupTraces.has(
          component.schematic_component_id,
        ) &&
          component.is_box_with_pins &&
          Boolean(component.source_group_id) &&
          component.schematic_sheet_id === group._resolveSchematicSheetId()),
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

  const componentNameToSectionId = new Map<string, string>()
  for (const component of group.getDescendants() as any[]) {
    if (component.name && component._parsedProps?.schSectionName) {
      componentNameToSectionId.set(
        component.name,
        component._parsedProps.schSectionName,
      )
    }
  }

  // Build chips and pinId maps
  const chips: InputChip[] = []
  const pinIdToSchematicPortId = new Map<string, string>()
  const schematicPortIdToPinId = new Map<string, string>()

  for (const schematicComponent of schematicComponents) {
    const chipId = schematicComponent.schematic_component_id
    const pins: InputPin[] = []

    const sourceComponent = db.source_component.getWhere({
      source_component_id: schematicComponent.source_component_id,
    })

    const schematicPorts = db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })

    for (const schematicPort of schematicPorts) {
      const sourcePort = db.source_port.get(schematicPort.source_port_id)!
      const selector = getSchematicPortSelector({
        componentName:
          sourceComponent?.name ?? schematicComponent.schematic_component_id,
        schematicPort,
        sourcePort,
      })
      pinIdToSchematicPortId.set(selector, schematicPort.schematic_port_id)
      schematicPortIdToPinId.set(schematicPort.schematic_port_id, selector)
    }

    for (const schematicPort of schematicPorts) {
      const pinId = schematicPortIdToPinId.get(schematicPort.schematic_port_id)!
      pins.push({
        pinId,
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

    let sectionId: string | undefined
    if (sourceComponent?.name) {
      sectionId = componentNameToSectionId.get(sourceComponent.name)
    }

    const layoutBounds =
      getSchematicComponentWithTextBounds(db, schematicComponent) ??
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
  const allSourceAndSchematicPortIdsInScope = new Set<string>()
  const schPortIdToSourcePortId = new Map<string, string>()
  const sourcePortIdToSchPortId = new Map<string, string>()
  const userNetIdToConnKey = new Map<string, string>()
  for (const sc of schematicComponents) {
    const ports = db.schematic_port.list({
      schematic_component_id: sc.schematic_component_id,
    })
    for (const sp of ports) {
      allSourceAndSchematicPortIdsInScope.add(sp.schematic_port_id)
      if (sp.source_port_id) {
        schPortIdToSourcePortId.set(sp.schematic_port_id, sp.source_port_id)
        sourcePortIdToSchPortId.set(sp.source_port_id, sp.schematic_port_id)
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
      if (sourcePortIdToSchPortId.has(source_port_id)) return true
    }
    return false
  })

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
    pinIds: [string, string]
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
      .map((srcId: string) => sourcePortIdToSchPortId.get(srcId))
      .filter(
        (sourcePortId): sourcePortId is string =>
          Boolean(sourcePortId) &&
          allSourceAndSchematicPortIdsInScope.has(sourcePortId!),
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
        let netLabelWidth: number | undefined
        if (
          traceLabel &&
          !traceLabel.startsWith(".") &&
          portDistance > maxMspDist
        ) {
          netLabelWidth = Number(
            getSchematicNetLabelTextWidth({
              text: String(traceLabel),
              font_size: 0.14,
            }).toFixed(2),
          )
        }
        directConnections.push({
          pinIds: [a, b].map((id) => schematicPortIdToPinId.get(id)!) as [
            string,
            string,
          ],
          netId: userNetId,
          netLabelWidth,
        })
      }
    }
  }

  // Net connections derived from named nets (source_net) in-scope
  const netConnections: Array<{
    netId: string
    pinIds: string[]
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
  const connKeyToPinIds = new Map<string, string[]>()
  for (const [schId, srcPortId] of schPortIdToSourcePortId) {
    const sp = db.source_port.get(srcPortId)
    if (!sp?.subcircuit_connectivity_map_key) continue
    const connKey = sp.subcircuit_connectivity_map_key
    if (!connKeyToPinIds.has(connKey)) connKeyToPinIds.set(connKey, [])
    connKeyToPinIds.get(connKey)!.push(schId)
  }

  for (const [connKey, schematicPortIds] of connKeyToPinIds) {
    const sourceNet = connKeyToSourceNet.get(connKey)
    if (sourceNet && schematicPortIds.length >= 1) {
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
        pinIds: schematicPortIds.map(
          (portId) => schematicPortIdToPinId.get(portId)!,
        ),
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
    directConnections,
    netConnections,
    textBoxes,
    availableNetLabelOrientations,
    maxMspPairDistance:
      group._parsedProps.schMaxTraceDistance ?? DEFAULT_MAX_MSP_PAIR_DISTANCE,
  }

  return {
    inputProblem,
    pinIdToSchematicPortId,
    connKeyToSourceNet,
    userNetIdToConnKey,
    connKeysWithExplicitPortNetTraces,
    allSourceAndSchematicPortIdsInScope,
    schPortIdToSourcePortId,
  }
}
