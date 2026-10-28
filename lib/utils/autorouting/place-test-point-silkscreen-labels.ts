import {
  type CircuitJsonUtilObjects,
  getBoardBounds,
  getPcbElementBounds,
} from "@tscircuit/circuit-json-util"
import { type Bounds, doBoundsOverlap } from "@tscircuit/math-utils"
import type {
  AnyCircuitElement,
  LayerRef,
  PcbSilkscreenText,
} from "circuit-json"
import { getPcbTextBounds } from "lib/components/base-components/NormalComponent/utils/getPcbTextBounds"

// Paired with a regular <testpoint />: its footprint's reference text sits
// 0.5 mm (center) above the pad edge at font size 0.4.
const FONT_SIZE = 0.4
const PAD_CLEARANCE = 0.5 - FONT_SIZE / 2

// Up first, like a regular test point, then the other sides and corners.
const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
] as const

export interface TestPointLabelTarget {
  pcbComponentId: string
  sourceTraceId: string
  x: number
  y: number
  diameter: number
  layer: LayerRef
}

/** Prefer the probed net's name, then the trace's name, then TP_1, TP_2, ... */
function getLabelText(
  db: CircuitJsonUtilObjects,
  sourceTraceId: string,
  usedNames: Set<string>,
): string {
  const trace = db.source_trace.get(sourceTraceId)
  const candidates = [
    ...(trace?.connected_source_net_ids ?? []).map(
      (id) => db.source_net.get(id)?.name,
    ),
    trace?.name,
  ]
  const preferred = candidates.find(
    (name): name is string => Boolean(name) && !usedNames.has(name!),
  )
  if (preferred) return preferred
  for (let i = 1; ; i++) if (!usedNames.has(`TP_${i}`)) return `TP_${i}`
}

const isOnLayer = (element: AnyCircuitElement, layer: LayerRef) =>
  !("layer" in element) || element.layer === layer

/** Copper, holes and silkscreen a label on `layer` must not cover. */
function getObstacleBounds(db: CircuitJsonUtilObjects, layer: LayerRef) {
  return [
    ...db.pcb_smtpad.list(),
    ...db.pcb_plated_hole.list(),
    ...db.pcb_hole.list(),
    ...db.pcb_via.list(),
    ...db.pcb_silkscreen_text.list(),
    ...db.pcb_silkscreen_path.list(),
    ...db.pcb_silkscreen_rect.list(),
    ...db.pcb_silkscreen_circle.list(),
    ...db.pcb_silkscreen_line.list(),
  ]
    .filter((element) => isOnLayer(element as AnyCircuitElement, layer))
    .map((element) => getPcbElementBounds(element as AnyCircuitElement))
    .filter((bounds): bounds is Bounds => bounds !== null)
}

const isInside = (inner: Bounds, outer: Bounds) =>
  inner.minX >= outer.minX &&
  inner.maxX <= outer.maxX &&
  inner.minY >= outer.minY &&
  inner.maxY <= outer.maxY

/**
 * Label generated test points like regular ones, trying the 8 positions
 * around each pad and keeping the first clear of copper, holes, silkscreen and
 * the board edge. Falls back to the position above the pad.
 */
export function placeTestPointSilkscreenLabels(
  db: CircuitJsonUtilObjects,
  targets: TestPointLabelTarget[],
  subcircuitId: string,
): void {
  const usedNames = new Set([
    ...db.source_component.list().map((component) => component.name),
    ...db.pcb_silkscreen_text.list().map((text) => text.text),
  ])
  const board = db.pcb_board.list()[0]
  const boardBounds = board ? getBoardBounds(board) : undefined
  // Measure each layer's obstacles once; placed labels join their layer's list.
  const obstaclesByLayer = new Map<LayerRef, Bounds[]>()

  for (const target of targets) {
    const text = getLabelText(db, target.sourceTraceId, usedNames)
    usedNames.add(text)
    let obstacles = obstaclesByLayer.get(target.layer)
    if (!obstacles) {
      obstacles = getObstacleBounds(db, target.layer)
      obstaclesByLayer.set(target.layer, obstacles)
    }
    const radius = target.diameter / 2
    const label = {
      pcb_component_id: target.pcbComponentId,
      subcircuit_id: subcircuitId,
      font: "tscircuit2024" as const,
      font_size: FONT_SIZE,
      text,
      layer: target.layer,
      anchor_alignment: "center" as const,
    }
    const { width, height } = getPcbTextBounds({
      ...label,
      anchor_position: { x: 0, y: 0 },
    } as PcbSilkscreenText)
    const positions = DIRECTIONS.map(([dx, dy]) => {
      // Diagonal positions clear the pad's edge at 45 degrees.
      const reach = dx && dy ? radius * Math.SQRT1_2 : radius
      return {
        x: target.x + dx * (reach + PAD_CLEARANCE + width / 2),
        y: target.y + dy * (reach + PAD_CLEARANCE + height / 2),
      }
    })
    const isClear = ({ x, y }: { x: number; y: number }) => {
      const bounds = {
        minX: x - width / 2,
        minY: y - height / 2,
        maxX: x + width / 2,
        maxY: y + height / 2,
      }
      return (
        (!boardBounds || isInside(bounds, boardBounds)) &&
        !obstacles.some((obstacle) => doBoundsOverlap(bounds, obstacle))
      )
    }
    const placed = db.pcb_silkscreen_text.insert({
      ...label,
      anchor_position: positions.find(isClear) ?? positions[0]!,
    })
    const placedBounds = getPcbElementBounds(placed)
    if (placedBounds) obstacles.push(placedBounds)
  }
}
