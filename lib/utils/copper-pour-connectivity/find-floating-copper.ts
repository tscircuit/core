import type { Polygon } from "@flatten-js/core"
import type {
  AnyCircuitElement,
  LayerRef,
  PcbCopperPour,
  PcbTraceRoutePoint,
  PcbVia,
} from "circuit-json"
import {
  getFullConnectivityMapFromCircuitJson,
  type ConnectivityMap,
} from "circuit-json-to-connectivity-map"
import Flatbush from "flatbush"
import { getViaSpanLayers } from "lib/utils/getViaSpanLayers"
import {
  copperPolygonsTouch,
  getPlatedHolePolygon,
  getPourPolygon,
  getSmtPadPolygon,
  getTraceSegmentPolygon,
  getViaPolygon,
} from "./copper-geometry"

type CopperNetId = NonNullable<
  ReturnType<ConnectivityMap["getNetConnectedToId"]>
>

// Match the pour solver's coordinate scale. Flatten's internal epsilon must
// not collapse the sub-micron edges emitted by polygon clipping into points.
const GEOMETRY_SCALE = 1e6
const CONTACT_TOLERANCE = 1e-7 * GEOMETRY_SCALE

interface CopperConductor {
  /** Board-world polygon, scaled by GEOMETRY_SCALE from mm for predicates. */
  polygon: Polygon
  layers: LayerRef[]
  netId: CopperNetId
  isTerminal: boolean
  pourId?: PcbCopperPour["pcb_copper_pour_id"]
  viaId?: PcbVia["pcb_via_id"]
}

const getRouteEndpoint = (
  routePoint: PcbTraceRoutePoint,
  side: "start" | "end",
) => {
  if (routePoint.route_type === "wire")
    return { point: routePoint, layer: routePoint.layer }
  if (routePoint.route_type === "via")
    return {
      point: routePoint,
      layer: side === "start" ? routePoint.from_layer : routePoint.to_layer,
    }
  return {
    point: routePoint[side],
    layer: side === "start" ? routePoint.start_layer : routePoint.end_layer,
  }
}

/** Find copper components with no same-net terminal or authored via.
 * All polygons are board-world points in mm (+X right, +Y up, right-handed).
 * Net membership only permits a contact; it never creates a physical edge.
 * Trace segments are independent conductors, and only plated barrels bridge
 * layers. Generated stitching vias and broken traces cannot anchor pours.
 * Nets without terminals or authored vias retain their authored pour geometry.
 * Includes every subcircuit so a child pour can reach a parent terminal.
 */
export const findFloatingCopper = (
  circuitJson: AnyCircuitElement[],
  generatedStitchingViaIds: ReadonlySet<PcbVia["pcb_via_id"]> = new Set(),
) => {
  const connectivity = getFullConnectivityMapFromCircuitJson(circuitJson)
  const pours = circuitJson.filter((e) => e.type === "pcb_copper_pour")
  const pouredNets = new Set(
    pours.flatMap((pour) =>
      pour.source_net_id
        ? [
            connectivity.getNetConnectedToId(pour.source_net_id) ??
              pour.source_net_id,
          ]
        : [],
    ),
  )
  const conductors: CopperConductor[] = []
  const add = (conductor: CopperConductor) => {
    if (pouredNets.has(conductor.netId) && !conductor.polygon.isEmpty())
      conductors.push({
        ...conductor,
        polygon: conductor.polygon.scale(GEOMETRY_SCALE, GEOMETRY_SCALE),
      })
  }
  const components = new Map(
    circuitJson
      .filter((e) => e.type === "pcb_component")
      .map((e) => [e.pcb_component_id, e]),
  )
  const vias = circuitJson.filter((e) => e.type === "pcb_via")
  const board = circuitJson.find((e) => e.type === "pcb_board")

  for (const pour of pours) {
    if (!pour.source_net_id) continue // Unassigned decorative copper has no target net to validate.
    add({
      polygon: getPourPolygon(pour),
      layers: [pour.layer],
      netId:
        connectivity.getNetConnectedToId(pour.source_net_id) ??
        pour.source_net_id,
      isTerminal: false,
      pourId: pour.pcb_copper_pour_id,
    })
  }
  for (const element of circuitJson) {
    if (element.type === "pcb_smtpad") {
      const netId = connectivity.getNetConnectedToId(element.pcb_smtpad_id)
      if (netId && pouredNets.has(netId))
        add({
          polygon: getSmtPadPolygon(element),
          layers: [element.layer],
          netId,
          isTerminal: !!element.pcb_port_id,
        })
    } else if (element.type === "pcb_plated_hole") {
      const netId = connectivity.getNetConnectedToId(element.pcb_plated_hole_id)
      if (netId && pouredNets.has(netId))
        add({
          polygon: getPlatedHolePolygon(
            element,
            element.pcb_component_id
              ? components.get(element.pcb_component_id)?.rotation
              : 0,
          ),
          layers: element.layers,
          netId,
          isTerminal: !!element.pcb_port_id,
        })
    } else if (element.type === "pcb_via") {
      const netId = connectivity.getNetConnectedToId(element.pcb_via_id)
      if (netId && pouredNets.has(netId))
        add({
          polygon: getViaPolygon(
            element,
            element.outer_diameter,
            element.hole_diameter,
          ),
          layers: element.layers,
          netId,
          isTerminal: !generatedStitchingViaIds.has(element.pcb_via_id),
          viaId: element.pcb_via_id,
        })
    } else if (element.type === "pcb_trace") {
      const netId = connectivity.getNetConnectedToId(element.pcb_trace_id)
      if (!netId || !pouredNets.has(netId)) continue
      for (let i = 0; i < element.route.length; i++) {
        const routePoint = element.route[i]!
        if (routePoint.route_type === "via") {
          const actualVia = vias.find(
            (via) =>
              via.x === routePoint.x &&
              via.y === routePoint.y &&
              via.layers.includes(routePoint.from_layer) &&
              via.layers.includes(routePoint.to_layer),
          )
          add({
            polygon: getViaPolygon(
              routePoint,
              actualVia?.outer_diameter ??
                routePoint.outer_diameter ??
                board?.min_via_pad_diameter ??
                0.3,
              actualVia?.hole_diameter ??
                routePoint.hole_diameter ??
                board?.min_via_hole_diameter ??
                0.2,
            ),
            layers:
              actualVia?.layers ??
              getViaSpanLayers({
                fromLayer: routePoint.from_layer,
                toLayer: routePoint.to_layer,
                layerCount: board?.num_layers ?? 2,
              }),
            netId,
            isTerminal: false,
          })
        }
        const next = element.route[i + 1]
        if (!next) continue
        const start = getRouteEndpoint(routePoint, "end")
        const end = getRouteEndpoint(next, "start")
        if (start.layer !== end.layer) continue
        const startWidth =
          routePoint.route_type === "via"
            ? next.route_type === "via"
              ? undefined
              : next.width
            : routePoint.width
        if (startWidth === undefined) continue
        const endWidth =
          element.route_thickness_mode === "interpolated" &&
          next.route_type !== "via"
            ? next.width
            : startWidth
        add({
          polygon: getTraceSegmentPolygon(
            start.point,
            end.point,
            startWidth,
            endWidth,
          ),
          layers: [start.layer],
          netId,
          isTerminal: false,
        })
      }
    }
  }

  const floatingPourIds = new Set<PcbCopperPour["pcb_copper_pour_id"]>()
  const floatingViaIds = new Set<PcbVia["pcb_via_id"]>()
  if (conductors.length === 0) return { floatingPourIds, floatingViaIds }
  const parent = conductors.map((_, i) => i)
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!
      i = parent[i]!
    }
    return i
  }
  const bounds = conductors.map((conductor) => conductor.polygon.box)
  const spatialIndex = new Flatbush(conductors.length)
  for (const box of bounds)
    spatialIndex.add(box.xmin, box.ymin, box.xmax, box.ymax)
  spatialIndex.finish()
  for (const [i, conductor] of conductors.entries()) {
    const box = bounds[i]!
    for (const j of spatialIndex.search(
      box.xmin - CONTACT_TOLERANCE,
      box.ymin - CONTACT_TOLERANCE,
      box.xmax + CONTACT_TOLERANCE,
      box.ymax + CONTACT_TOLERANCE,
    )) {
      if (j <= i || find(i) === find(j)) continue
      const neighbor = conductors[j]!
      if (
        conductor.netId !== neighbor.netId ||
        !conductor.layers.some((layer) => neighbor.layers.includes(layer))
      )
        continue
      if (
        copperPolygonsTouch(
          conductor.polygon,
          neighbor.polygon,
          CONTACT_TOLERANCE,
        )
      )
        parent[find(j)] = find(i)
    }
  }
  const netsWithTerminals = new Set(
    conductors.flatMap((conductor) =>
      conductor.isTerminal ? [conductor.netId] : [],
    ),
  )
  const terminalRoots = new Set(
    conductors.flatMap((conductor, i) =>
      conductor.isTerminal ? [find(i)] : [],
    ),
  )
  for (const [i, conductor] of conductors.entries()) {
    if (!netsWithTerminals.has(conductor.netId) || terminalRoots.has(find(i)))
      continue
    if (conductor.pourId) floatingPourIds.add(conductor.pourId)
    if (conductor.viaId) floatingViaIds.add(conductor.viaId)
  }
  return { floatingPourIds, floatingViaIds }
}
