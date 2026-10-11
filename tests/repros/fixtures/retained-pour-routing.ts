import Flatten from "@flatten-js/core"
import type {
  AnyCircuitElement,
  PcbCopperPourBRep,
  PcbTrace,
} from "circuit-json"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import {
  getCircuitJsonPcbTraceRoute,
  type PcbTraceRoutePointWithSrjMetadata,
} from "lib/utils/autorouting/get-circuit-json-pcb-trace-route"

export const routeRetainedPourConnections = (routingInput: SimpleRouteJson) => {
  const routedTraces: PcbTrace[] = []
  const vias: AnyCircuitElement[] = []
  for (const connection of routingInput.connections) {
    const output = new TscircuitAutorouter(
      { ...routingInput, connections: [connection] },
      { autorouterVersion: "beta_pipeline9" },
    ).solveSync()
    const outputTrace = output.find(
      (trace) => trace.connection_name === connection.name,
    )
    if (!outputTrace) throw new Error("The native router returned no route")
    const pcbTrace: PcbTrace = {
      type: "pcb_trace",
      pcb_trace_id: outputTrace.pcb_trace_id,
      source_trace_id: connection.source_trace_id,
      route: getCircuitJsonPcbTraceRoute(
        outputTrace.route as PcbTraceRoutePointWithSrjMetadata[],
      ),
    }
    routedTraces.push(pcbTrace)
    for (const [viaIndex, via] of outputTrace.route
      .filter((point) => point.route_type === "via")
      .entries()) {
      vias.push({
        type: "pcb_via",
        pcb_via_id: `${outputTrace.pcb_trace_id}_via_${viaIndex}`,
        pcb_trace_id: pcbTrace.pcb_trace_id,
        x: via.x,
        y: via.y,
        hole_diameter: via.via_hole_diameter ?? 0.2,
        outer_diameter: via.via_diameter ?? 0.3,
        layers: ["top", "bottom"],
        from_layer: via.from_layer as "top" | "bottom",
        to_layer: via.to_layer as "top" | "bottom",
      })
    }
  }
  return { routedTraces, vias }
}

/**
 * Independent wire-body intersection against the emitted, unedited BREP.
 * Points are circuit-world mm (+X right, +Y up); widths are physical distances.
 * The compiled fixtures emit polygonal boundaries, so no curve flattening is
 * needed here. The separate actual DRC checker includes endpoint/via copper.
 */
export const getRetainedPourWireOverlapArea = (
  pour: PcbCopperPourBRep,
  trace: PcbTrace,
  clearance = 0,
) => {
  const pourPolygon = new Flatten.Polygon()
  const outer = pourPolygon.addFace(
    pour.brep_shape.outer_ring.vertices.map(({ x, y }) => Flatten.point(x, y)),
  )
  if (outer.orientation() !== Flatten.ORIENTATION.CCW) outer.reverse()
  for (const ring of pour.brep_shape.inner_rings) {
    const hole = pourPolygon.addFace(
      ring.vertices.map(({ x, y }) => Flatten.point(x, y)),
    )
    if (hole.orientation() !== Flatten.ORIENTATION.CW) hole.reverse()
  }
  let area = 0
  for (let i = 0; i < trace.route.length - 1; i++) {
    const start = trace.route[i]!
    const end = trace.route[i + 1]!
    if (
      start.route_type !== "wire" ||
      end.route_type === "through_pad" ||
      start.layer !== pour.layer ||
      (end.route_type === "wire" && end.layer !== pour.layer) ||
      (end.route_type === "via" && end.from_layer !== pour.layer)
    ) {
      continue
    }
    const length = Math.hypot(end.x - start.x, end.y - start.y)
    if (length === 0) continue
    const halfWidth = start.width / 2 + clearance
    const normalX = (-(end.y - start.y) / length) * halfWidth
    const normalY = ((end.x - start.x) / length) * halfWidth
    const wire = new Flatten.Polygon([
      Flatten.point(start.x + normalX, start.y + normalY),
      Flatten.point(start.x - normalX, start.y - normalY),
      Flatten.point(end.x - normalX, end.y - normalY),
      Flatten.point(end.x + normalX, end.y + normalY),
    ])
    area += Flatten.BooleanOperations.intersect(pourPolygon, wire).area()
  }
  return area
}
