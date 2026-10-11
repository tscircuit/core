import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbComponent, PcbPort } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type {
  SimpleRouteJson,
  SingleLayerConnectionPoint,
} from "./SimpleRouteJson"

type PcbComponentId = PcbComponent["pcb_component_id"]
type PcbPortId = PcbPort["pcb_port_id"]

export interface ChipOrientationWarningThreshold {
  minimumCrossingsRemoved: number
  minimumFractionRemoved: number
}

export const DEFAULT_CHIP_ORIENTATION_WARNING_THRESHOLD: ChipOrientationWarningThreshold =
  {
    minimumCrossingsRemoved: 2,
    minimumFractionRemoved: 0.25,
  }

export interface ChipOrientationAnalysis {
  pcbComponentId: PcbComponentId
  chipName: string
  currentRotation: number
  recommendedRotation: number
  currentCrossings: number
  bestCrossings: number
  orientations: Array<{ rotation: number; crossings: number }>
  shouldWarn: boolean
}

type Airwire = {
  netName: string
  start: SingleLayerConnectionPoint
  end: SingleLayerConnectionPoint
}

/** Proper interior crossings only: touching endpoints and collinear wires do
 * not count. Points are board-world mm, +X right, +Y up, +Z above (right-handed). */
const crosses = (a: Airwire, b: Airwire) => {
  const side = (
    p: SingleLayerConnectionPoint,
    q: SingleLayerConnectionPoint,
    r: SingleLayerConnectionPoint,
  ) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  const opposite = (a: number, b: number) =>
    (a > 1e-9 && b < -1e-9) || (a < -1e-9 && b > 1e-9)
  return (
    opposite(side(a.start, a.end, b.start), side(a.start, a.end, b.end)) &&
    opposite(side(b.start, b.end, a.start), side(b.start, b.end, a.end))
  )
}

/** Analyze four quarter turns of each chip independently, holding other parts
 * fixed. Geometry is board-world mm (+X right, +Y up, +Z above, right-handed
 * points); rotation is CCW about the placed component center. Rotating already
 * emitted ports preserves bottom-side mirroring. This is an airwire heuristic,
 * not a feasibility check: obstacles, wire lengths and copper are not scored.
 * Only two-terminal, same-layer, original-pad SRJ connections are supported;
 * fanout exits, multilayer and multi-terminal nets are deliberately omitted. */
export function getSuboptimalChipOrientationsSrj({
  db,
  simpleRouteJson,
  threshold = DEFAULT_CHIP_ORIENTATION_WARNING_THRESHOLD,
}: {
  db: Pick<
    CircuitJsonUtilObjects,
    "pcb_component" | "source_component" | "pcb_port"
  >
  simpleRouteJson: SimpleRouteJson
  threshold?: ChipOrientationWarningThreshold
}): ChipOrientationAnalysis[] {
  if (
    !Number.isInteger(threshold.minimumCrossingsRemoved) ||
    threshold.minimumCrossingsRemoved < 1 ||
    !Number.isFinite(threshold.minimumFractionRemoved) ||
    threshold.minimumFractionRemoved < 0 ||
    threshold.minimumFractionRemoved > 1
  ) {
    throw new Error("Invalid chip orientation warning threshold")
  }
  const pcbPortsById = new Map<PcbPortId, PcbPort>(
    db.pcb_port.list().map((port) => [port.pcb_port_id, port]),
  )
  const isOriginalPad = (point: SingleLayerConnectionPoint) => {
    const port = point.pcb_port_id
      ? pcbPortsById.get(point.pcb_port_id)
      : undefined
    return (
      port &&
      port.layers.some((layer) => layer === point.layer) &&
      Math.hypot(point.x - port.x, point.y - port.y) < 1e-6
    )
  }
  const airwires: Airwire[] = simpleRouteJson.connections.flatMap(
    (connection) => {
      const [start, end] = connection.pointsToConnect
      if (
        connection.isOffBoard ||
        connection.pointsToConnect.length !== 2 ||
        start.layer !== end.layer ||
        !isOriginalPad(start) ||
        !isOriginalPad(end)
      )
        return []
      return [
        {
          netName:
            connection.netConnectionName ??
            connection.rootConnectionName ??
            connection.name,
          start,
          end,
        },
      ]
    },
  )
  const analyses: ChipOrientationAnalysis[] = []
  for (const chip of db.pcb_component.list()) {
    const sourceChip = db.source_component.get(chip.source_component_id)
    if (sourceChip?.ftype !== "simple_chip" || chip.do_not_place) continue
    const belongsToChip = (point: SingleLayerConnectionPoint) =>
      point.pcb_port_id !== undefined &&
      pcbPortsById.get(point.pcb_port_id)?.pcb_component_id ===
        chip.pcb_component_id
    const incident = airwires.map(
      (wire) => belongsToChip(wire.start) || belongsToChip(wire.end),
    )
    if (!incident.some(Boolean)) continue
    const orientations = [0, 90, 180, 270].map((delta) => {
      // Same CCW rotation convention as PrimitiveComponent.computePcbPropsTransform:
      // compose(translate(pcbX, pcbY), rotate(rotation)). Here the delta operates
      // on emitted world ports about the placed center, after any layer mirror.
      const transform = compose(
        translate(chip.center.x, chip.center.y),
        rotateDEG(delta),
        translate(-chip.center.x, -chip.center.y),
      )
      const rotatePort = (point: SingleLayerConnectionPoint) =>
        belongsToChip(point)
          ? { ...point, ...applyToPoint(transform, point) }
          : point
      const rotated = airwires.map((wire) => ({
        ...wire,
        start: rotatePort(wire.start),
        end: rotatePort(wire.end),
      }))
      let crossings = 0
      for (let first = 0; first < rotated.length; first++) {
        for (let second = first + 1; second < rotated.length; second++) {
          if (
            !(incident[first] || incident[second]) ||
            rotated[first].netName === rotated[second].netName ||
            rotated[first].start.layer !== rotated[second].start.layer
          )
            continue
          if (crosses(rotated[first], rotated[second])) crossings++
        }
      }
      return {
        rotation: (((chip.rotation + delta) % 360) + 360) % 360,
        crossings,
      }
    })
    // Stable ties prefer the current placement, avoiding unnecessary advice.
    const best = orientations.reduce((best, orientation) =>
      orientation.crossings < best.crossings ? orientation : best,
    )
    const current = orientations[0]
    const removed = current.crossings - best.crossings
    analyses.push({
      pcbComponentId: chip.pcb_component_id,
      chipName: sourceChip.name || "unnamed chip",
      currentRotation: current.rotation,
      recommendedRotation: best.rotation,
      currentCrossings: current.crossings,
      bestCrossings: best.crossings,
      orientations,
      shouldWarn:
        removed >= threshold.minimumCrossingsRemoved &&
        removed / current.crossings >= threshold.minimumFractionRemoved,
    })
  }
  return analyses
}
