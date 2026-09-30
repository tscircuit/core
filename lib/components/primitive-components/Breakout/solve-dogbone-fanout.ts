import {
  matchComponentDogboneViaSites,
  type PreparedBus,
  type DogboneViaSiteGeometryRules,
} from "@tscircuit/fanout-solver"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import type { Breakout } from "./Breakout"

/** Solve local pad-to-via escapes in right-handed board-world mm (+X right,
 * +Y up, +Z above). All coordinates are points. Uses emitted pad geometry, so
 * footprint rotation/reflection is already applied by core's layout transforms.
 * Handoff points are committed only after the complete assignment is valid. */
export function solveDogboneFanout(breakout: Breakout): SimplifiedPcbTrace[] {
  const points = breakout.children.filter(
    (child): child is AutoplacedBreakoutPoint =>
      child instanceof AutoplacedBreakoutPoint,
  )
  if (!points.length) return []
  const { db } = breakout.root!
  const scope = breakout.getSubcircuit()
  const traceWidth = Number(
    breakout.getInheritedProperty("minTraceWidth") ?? 0.15,
  )
  const clearance = Number(
    breakout.getInheritedProperty("minTraceToPadEdgeClearance") ?? 0.1,
  )
  const viaDiameter = Number(
    breakout.getInheritedProperty("minViaPadDiameter") ?? 0.6,
  )
  const holeDiameter = Number(
    breakout.getInheritedProperty("minViaHoleDiameter") ?? 0.3,
  )
  const viaClearance = Number(
    breakout.getInheritedProperty("minViaEdgeToPadEdgeClearance") ?? clearance,
  )
  const boardEdgeClearance = Number(
    breakout.getInheritedProperty("minBoardEdgeClearance") ?? clearance,
  )
  const holeClearance = Number(
    breakout.getInheritedProperty("minViaHoleEdgeToViaHoleEdgeClearance") ??
      clearance,
  )
  const { simpleRouteJson: input } = getSimpleRouteJsonFromCircuitJson({
    db,
    subcircuit_id: scope.subcircuit_id,
    subcircuitComponent: scope,
    minTraceWidth: traceWidth,
  })
  const layers = getViaBoardLayers(input.layerCount)
  const allowedLayers = breakout._parsedProps.fanoutRoutingLayers ?? layers
  if (allowedLayers.some((layer) => !layers.includes(layer)))
    throw new Error("Dogbone fanout targets an unavailable board layer")
  const buses: PreparedBus[] = []
  const targets = points.map((point, connectionIndex) => {
    const port = db.pcb_port.get(point.matchedPort!.pcb_port_id!)!
    const sourceObstacle = input.obstacles.find(
      (obstacle) =>
        obstacle.componentId === port.pcb_component_id &&
        Math.hypot(obstacle.center.x - port.x, obstacle.center.y - port.y) <
          1e-6,
    )
    if (!sourceObstacle)
      throw new Error(
        "Dogbone fanout requires a component pad at each source port",
      )
    if (port.layers.length !== 1 || !layers.includes(port.layers[0]!)) {
      throw new Error("Dogbone fanout requires a single-layer SMT source pad")
    }
    const sourceLayer = port.layers[0]!
    const targetLayer = allowedLayers.find((layer) => layer !== sourceLayer)
    if (!targetLayer)
      throw new Error(
        "Dogbone fanout requires a legal layer distinct from the source pad",
      )
    let bus = buses.find(
      (bus) => bus.componentId === sourceObstacle.componentId,
    )
    if (!bus) {
      const pads = input.obstacles.filter(
        (obstacle) => obstacle.componentId === sourceObstacle.componentId,
      )
      const xs = [
        ...new Set(pads.map((pad) => Math.round(pad.center.x * 1e6) / 1e6)),
      ].sort((a, b) => a - b)
      const ys = [
        ...new Set(pads.map((pad) => Math.round(pad.center.y * 1e6) / 1e6)),
      ].sort((a, b) => a - b)
      if (xs.length < 2 || ys.length < 2)
        throw new Error("Dogbone fanout requires a two-dimensional pad grid")
      const pitch = (coordinates: number[]) =>
        Math.min(...coordinates.slice(1).map((v, i) => v - coordinates[i]!))
      bus = {
        busId: sourceObstacle.componentId!,
        componentId: sourceObstacle.componentId!,
        componentObstacles: pads,
        connections: [],
        direction: "down",
        termination: { type: "boundary" },
        componentBounds: {
          minX: xs[0]!,
          maxX: xs.at(-1)!,
          minY: ys[0]!,
          maxY: ys.at(-1)!,
        },
        sharedBoundary: input.bounds,
        xCoordinates: xs,
        yCoordinates: ys,
        pitchX: pitch(xs),
        pitchY: pitch(ys),
      }
      buses.push(bus)
    }
    const sourcePoint = {
      x: port.x,
      y: port.y,
      layer: sourceLayer,
      pcb_port_id: port.pcb_port_id,
    }
    bus.connections.push({
      connectionIndex,
      connection: { name: port.pcb_port_id, pointsToConnect: [sourcePoint] },
      sourcePoint,
      sourcePointIndex: 0,
      sourceLayer,
      sourceObstacle,
      targetPoint: sourcePoint,
    })
    return { point, port, sourceLayer, targetLayer }
  })
  const sites = new Map<number, { x: number; y: number }>()
  const blockingSegments: NonNullable<
    DogboneViaSiteGeometryRules["blockingSegments"]
  >[number][] = []
  const blockingVias: NonNullable<
    DogboneViaSiteGeometryRules["blockingVias"]
  >[number][] = []
  for (const bus of buses) {
    const assignment = matchComponentDogboneViaSites([bus], {
      traceWidth,
      clearance: Math.max(clearance, viaClearance),
      viaDiameter,
      viaHoleDiameter: holeDiameter,
      holeToHoleClearance: holeClearance,
      additionalObstacles: input.obstacles,
      blockingSegments,
      blockingVias,
    })
    if (!assignment || assignment.size !== bus.connections.length)
      throw new Error(
        "No complete local dogbone assignment within clearance/search limits",
      )
    for (const connection of bus.connections) {
      const connectionIndex = connection.connectionIndex
      const via = assignment.get(connectionIndex)!
      sites.set(connectionIndex, via)
      blockingSegments.push({
        connectionIndex,
        segment: {
          start: connection.sourcePoint,
          end: via,
          width: traceWidth,
          layer: connection.sourceLayer,
        },
      })
      blockingVias.push({
        connectionIndex,
        center: via,
        diameter: viaDiameter,
        spanLayers: layers,
      })
    }
  }
  const traces: SimplifiedPcbTrace[] = targets.map(
    ({ point, port, sourceLayer, targetLayer }, index) => {
      const via = sites.get(index)!
      const dx = Math.abs(via.x - port.x),
        dy = Math.abs(via.y - port.y)
      if (dx > 1e-6 && dy > 1e-6 && Math.abs(dx - dy) > 1e-6)
        throw new Error(
          "Dogbone fanout requires straight or 45-degree local escapes",
        )
      const margin = viaDiameter / 2 + boardEdgeClearance
      if (
        via.x < input.bounds.minX + margin ||
        via.x > input.bounds.maxX - margin ||
        via.y < input.bounds.minY + margin ||
        via.y > input.bounds.maxY - margin
      )
        throw new Error("Dogbone via violates board-edge clearance")
      return {
        type: "pcb_trace",
        pcb_trace_id: `dogbone_${port.pcb_port_id}`,
        source_trace_id: point.matchedSourceTraceId ?? undefined,
        connectsTo: [port.pcb_port_id],
        route: [
          {
            route_type: "wire",
            x: port.x,
            y: port.y,
            layer: sourceLayer,
            width: traceWidth,
          },
          { route_type: "wire", ...via, layer: sourceLayer, width: traceWidth },
          {
            route_type: "via",
            ...via,
            from_layer: sourceLayer,
            to_layer: targetLayer,
            via_diameter: viaDiameter,
            via_hole_diameter: holeDiameter,
            layers,
          },
          { route_type: "wire", ...via, layer: targetLayer, width: traceWidth },
          { route_type: "wire", ...via, layer: targetLayer, width: traceWidth },
        ],
      }
    },
  )
  for (const [index, { point, targetLayer }] of targets.entries()) {
    point._applySolvedBreakoutPoint({
      sourceTraceId: point.matchedSourceTraceId!,
      layer: targetLayer,
      position: sites.get(index)!,
    })
  }
  return traces
}
