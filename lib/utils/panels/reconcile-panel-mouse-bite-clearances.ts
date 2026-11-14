import * as Flatten from "@flatten-js/core"
import type {
  AnyCircuitElement,
  PcbNoteText,
  PcbPlatedHole,
  PcbSilkscreenText,
  PcbSmtPad,
  Point,
} from "circuit-json"
import type { PanelMouseBiteCandidate } from "./get-panel-mouse-bite-positions"

export const PREFERRED_MOUSE_BITE_COPPER_CLEARANCE_MM = 0.25
export const MIN_MOUSE_BITE_COPPER_CLEARANCE_MM = 0.2
export const PREFERRED_MOUSE_BITE_SILKSCREEN_CLEARANCE_MM = 0.12
export const MIN_MOUSE_BITE_SILKSCREEN_CLEARANCE_MM = 0.05
const SHIFT_STEP_MM = 0.025
const PITCH_EPSILON_MM = 1e-6

export interface TrackedPanelMouseBite extends PanelMouseBiteCandidate {
  pcb_hole_id: string
}

export interface ReconciledPanelMouseBite {
  pcb_hole_id: string
  x: number
  y: number
  hole_diameter: number
}

function distPointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq <= 1e-12) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq),
  )
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function distPointToOrientedRect(
  p: Point,
  center: Point,
  width: number,
  height: number,
  ccwRotationDeg = 0,
): number {
  const rad = (-ccwRotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const relX = p.x - center.x
  const relY = p.y - center.y
  const localX = relX * cos - relY * sin
  const localY = relX * sin + relY * cos
  const dx = Math.max(0, Math.abs(localX) - width / 2)
  const dy = Math.max(0, Math.abs(localY) - height / 2)
  return Math.hypot(dx, dy)
}

function distPointToPolygon(p: Point, points: Point[]): number {
  if (points.length === 0) return Number.POSITIVE_INFINITY
  if (points.length === 1)
    return Math.hypot(p.x - points[0]!.x, p.y - points[0]!.y)
  let inside = false
  let minEdgeDist = Number.POSITIVE_INFINITY
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    minEdgeDist = Math.min(minEdgeDist, distPointToSegment(p, a, b))
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside
    }
  }
  return inside ? 0 : minEdgeDist
}

function getOrientedTextBox(text: PcbSilkscreenText | PcbNoteText): {
  center: Point
  width: number
  height: number
  ccwRotationDeg: number
} | null {
  const content = text.text ?? ""
  if (!content) return null
  const fontSize = text.font_size
  // Match KiCad gr_text stroke-font rendering (font.size.width = fontSize and
  // stroke thickness = min(0.3, fontSize * 0.2) above 1 mm, else 0.15 mm).
  const strokeThickness = fontSize > 1 ? Math.min(0.3, fontSize * 0.2) : 0.15
  const width = content.length * fontSize * 0.85 + strokeThickness
  const height = fontSize + strokeThickness
  const alignment = text.anchor_alignment || "center"
  let offsetX = 0
  let offsetY = 0
  // Circuit JSON uses +X right, +Y up: a "top_*" anchor sits at the top (+Y)
  // edge of the glyph box so the box center is at -height / 2, and vice versa.
  switch (alignment) {
    case "top_left":
      offsetX = width / 2
      offsetY = -height / 2
      break
    case "top_center":
      offsetY = -height / 2
      break
    case "top_right":
      offsetX = -width / 2
      offsetY = -height / 2
      break
    case "center_left":
      offsetX = width / 2
      break
    case "center_right":
      offsetX = -width / 2
      break
    case "bottom_left":
      offsetX = width / 2
      offsetY = height / 2
      break
    case "bottom_center":
      offsetY = height / 2
      break
    case "bottom_right":
      offsetX = -width / 2
      offsetY = height / 2
      break
  }
  const ccwRotationDeg =
    "ccw_rotation" in text && typeof text.ccw_rotation === "number"
      ? text.ccw_rotation
      : 0
  const rad = (ccwRotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    center: {
      x: text.anchor_position.x + offsetX * cos - offsetY * sin,
      y: text.anchor_position.y + offsetX * sin + offsetY * cos,
    },
    width,
    height,
    ccwRotationDeg,
  }
}

function getSmtPadCenterDist(p: Point, pad: PcbSmtPad): number {
  if (pad.shape === "circle") {
    return Math.hypot(p.x - pad.x, p.y - pad.y) - pad.radius
  }
  if (pad.shape === "polygon") {
    return distPointToPolygon(p, pad.points)
  }
  const rotation = "ccw_rotation" in pad ? (pad.ccw_rotation ?? 0) : 0
  return distPointToOrientedRect(
    p,
    { x: pad.x, y: pad.y },
    pad.width,
    pad.height,
    rotation,
  )
}

function getPlatedHoleCenterDist(p: Point, hole: PcbPlatedHole): number {
  if (hole.shape === "circle") {
    return Math.hypot(p.x - hole.x, p.y - hole.y) - hole.outer_diameter / 2
  }
  if (hole.shape === "oval" || hole.shape === "pill") {
    return distPointToOrientedRect(
      p,
      { x: hole.x, y: hole.y },
      hole.outer_width,
      hole.outer_height,
      hole.ccw_rotation ?? 0,
    )
  }
  if (
    hole.shape === "circular_hole_with_rect_pad" ||
    hole.shape === "pill_hole_with_rect_pad" ||
    hole.shape === "rotated_pill_hole_with_rect_pad"
  ) {
    const rotation =
      "rect_ccw_rotation" in hole ? (hole.rect_ccw_rotation ?? 0) : 0
    const padOffsetX =
      "rect_pad_x_offset" in hole && typeof hole.rect_pad_x_offset === "number"
        ? hole.rect_pad_x_offset
        : 0
    const padOffsetY =
      "rect_pad_y_offset" in hole && typeof hole.rect_pad_y_offset === "number"
        ? hole.rect_pad_y_offset
        : 0
    return distPointToOrientedRect(
      p,
      {
        x: hole.x + padOffsetX,
        y: hole.y + padOffsetY,
      },
      hole.rect_pad_width,
      hole.rect_pad_height,
      rotation,
    )
  }
  if (hole.shape === "hole_with_polygon_pad" && hole.pad_outline?.length) {
    const rad = (((hole.ccw_rotation ?? 0) as number) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const worldOutline = hole.pad_outline.map((pt) => ({
      x: hole.x + pt.x * cos - pt.y * sin,
      y: hole.y + pt.x * sin + pt.y * cos,
    }))
    return distPointToPolygon(p, worldOutline)
  }
  return Number.POSITIVE_INFINITY
}

function computeClearancesAtPoint(
  p: Point,
  holeRadius: number,
  elements: AnyCircuitElement[],
): { minCopperGap: number; minSilkscreenGap: number } {
  let minCopperGap = Number.POSITIVE_INFINITY
  let minSilkscreenGap = Number.POSITIVE_INFINITY

  for (const el of elements) {
    switch (el.type) {
      case "pcb_trace": {
        const route = el.route
        for (let i = 0; i < route.length; i++) {
          const pt = route[i]!
          if (pt.route_type === "via") {
            const viaRadius =
              ("outer_diameter" in pt && typeof pt.outer_diameter === "number"
                ? pt.outer_diameter
                : 0.6) / 2
            minCopperGap = Math.min(
              minCopperGap,
              Math.hypot(p.x - pt.x, p.y - pt.y) - viaRadius - holeRadius,
            )
          } else if (pt.route_type === "through_pad") {
            const halfWidth = Math.max(pt.width, 0.15) / 2
            minCopperGap = Math.min(
              minCopperGap,
              distPointToSegment(p, pt.start, pt.end) - halfWidth - holeRadius,
            )
          }
          if (i + 1 < route.length) {
            const next = route[i + 1]!
            const aPt =
              "x" in pt ? pt : pt.route_type === "through_pad" ? pt.end : null
            const bPt =
              "x" in next
                ? next
                : next.route_type === "through_pad"
                  ? next.start
                  : null
            if (aPt && bPt) {
              const w1 = "width" in pt ? pt.width : 0
              const w2 = "width" in next ? next.width : 0
              const halfWidth = Math.max(w1, w2, 0.15) / 2
              minCopperGap = Math.min(
                minCopperGap,
                distPointToSegment(p, aPt, bPt) - halfWidth - holeRadius,
              )
            }
          }
        }
        break
      }
      case "pcb_via": {
        minCopperGap = Math.min(
          minCopperGap,
          Math.hypot(p.x - el.x, p.y - el.y) -
            el.outer_diameter / 2 -
            holeRadius,
        )
        break
      }
      case "pcb_smtpad": {
        minCopperGap = Math.min(
          minCopperGap,
          getSmtPadCenterDist(p, el) - holeRadius,
        )
        break
      }
      case "pcb_plated_hole": {
        minCopperGap = Math.min(
          minCopperGap,
          getPlatedHoleCenterDist(p, el) - holeRadius,
        )
        break
      }
      case "pcb_silkscreen_text":
      case "pcb_note_text": {
        const box = getOrientedTextBox(el)
        if (box) {
          minSilkscreenGap = Math.min(
            minSilkscreenGap,
            distPointToOrientedRect(
              p,
              box.center,
              box.width,
              box.height,
              box.ccwRotationDeg,
            ) - holeRadius,
          )
        }
        break
      }
      case "pcb_silkscreen_path": {
        const halfStroke = (el.stroke_width || 0.1) / 2
        for (let i = 0; i + 1 < el.route.length; i++) {
          minSilkscreenGap = Math.min(
            minSilkscreenGap,
            distPointToSegment(p, el.route[i]!, el.route[i + 1]!) -
              halfStroke -
              holeRadius,
          )
        }
        break
      }
      case "pcb_silkscreen_line": {
        const halfStroke = (el.stroke_width || 0.1) / 2
        minSilkscreenGap = Math.min(
          minSilkscreenGap,
          distPointToSegment(
            p,
            { x: el.x1, y: el.y1 },
            { x: el.x2, y: el.y2 },
          ) -
            halfStroke -
            holeRadius,
        )
        break
      }
      case "pcb_silkscreen_rect": {
        const halfStroke = el.is_filled ? 0 : (el.stroke_width || 0.1) / 2
        minSilkscreenGap = Math.min(
          minSilkscreenGap,
          distPointToOrientedRect(
            p,
            el.center,
            el.width + halfStroke * 2,
            el.height + halfStroke * 2,
            el.ccw_rotation ?? 0,
          ) - holeRadius,
        )
        break
      }
      case "pcb_silkscreen_circle": {
        const halfStroke = el.is_filled ? 0 : (el.stroke_width || 0.1) / 2
        minSilkscreenGap = Math.min(
          minSilkscreenGap,
          Math.hypot(p.x - el.center.x, p.y - el.center.y) -
            (el.radius + halfStroke) -
            holeRadius,
        )
        break
      }
    }
  }

  return { minCopperGap, minSilkscreenGap }
}

function resolveOutwardTabShiftDirection(
  candidate: PanelMouseBiteCandidate,
  boardPolygons: Flatten.Polygon[],
): Point {
  const { position, shiftDirection } = candidate
  const len = Math.hypot(shiftDirection.x, shiftDirection.y)
  if (len <= 1e-9) return { x: 0, y: 0 }
  const dir = { x: shiftDirection.x / len, y: shiftDirection.y / len }
  const forwardProbe = Flatten.point(
    position.x + dir.x * 0.02,
    position.y + dir.y * 0.02,
  )
  const backwardProbe = Flatten.point(
    position.x - dir.x * 0.02,
    position.y - dir.y * 0.02,
  )
  const entersNeighborBoard = boardPolygons.some(
    (poly) => poly.contains(forwardProbe) && !poly.contains(backwardProbe),
  )
  return entersNeighborBoard ? { x: -dir.x, y: -dir.y } : dir
}

/**
 * Reconciles mouse-bite holes against already-placed board copper (fixed
 * `pcbPath` traces, pads, vias, plated holes) and silkscreen elements.
 *
 * Unconflicted drills remain at their exact initial board-edge positions.
 * Drills that come within copper or silkscreen clearance shift outward into
 * the tab bridge along `shiftDirection` while maintaining `minimumDrillPitch`
 * from every other mouse-bite drill; if no valid position exists in the tab
 * span (e.g. copper crosses directly through the tab), that obstructed bite is
 * omitted rather than drilling into copper.
 */
export function reconcilePanelMouseBiteClearances({
  candidates,
  holeDiameter,
  minimumDrillPitch,
  boardOutlines,
  elements,
  minShiftsByHoleId,
  previouslyRemovedHoleIds,
}: {
  candidates: TrackedPanelMouseBite[]
  holeDiameter: number
  minimumDrillPitch: number
  boardOutlines: Point[][]
  elements: AnyCircuitElement[]
  minShiftsByHoleId?: ReadonlyMap<string, number>
  previouslyRemovedHoleIds?: ReadonlySet<string>
}): {
  kept: ReconciledPanelMouseBite[]
  removedHoleIds: string[]
  appliedShiftsByHoleId: Map<string, number>
} {
  const appliedShiftsByHoleId = new Map<string, number>()
  if (candidates.length === 0) {
    return { kept: [], removedHoleIds: [], appliedShiftsByHoleId }
  }

  const holeRadius = holeDiameter / 2
  const boardPolygons = boardOutlines
    .filter((outline) => outline.length >= 3)
    .map(
      (outline) =>
        new Flatten.Polygon(outline.map((pt) => Flatten.point(pt.x, pt.y))),
    )

  const resolvedDirs = candidates.map((c) =>
    resolveOutwardTabShiftDirection(c, boardPolygons),
  )

  const relevantElements = elements.filter(
    (el) =>
      el.type === "pcb_trace" ||
      el.type === "pcb_via" ||
      el.type === "pcb_smtpad" ||
      el.type === "pcb_plated_hole" ||
      el.type === "pcb_silkscreen_text" ||
      el.type === "pcb_note_text" ||
      el.type === "pcb_silkscreen_path" ||
      el.type === "pcb_silkscreen_line" ||
      el.type === "pcb_silkscreen_rect" ||
      el.type === "pcb_silkscreen_circle",
  )

  const state: Array<{
    pcb_hole_id: string
    x: number
    y: number
    shift: number
    removed: boolean
  }> = candidates.map((c, idx) => {
    const dir = resolvedDirs[idx]!
    const priorShift = minShiftsByHoleId?.get(c.pcb_hole_id) ?? 0
    const wasRemoved = previouslyRemovedHoleIds?.has(c.pcb_hole_id) ?? false
    return {
      pcb_hole_id: c.pcb_hole_id,
      x: c.position.x + dir.x * priorShift,
      y: c.position.y + dir.y * priorShift,
      shift: priorShift,
      removed: wasRemoved,
    }
  })

  if (relevantElements.length === 0) {
    const kept: ReconciledPanelMouseBite[] = []
    const removedHoleIds: string[] = []
    for (const entry of state) {
      if (entry.removed) {
        removedHoleIds.push(entry.pcb_hole_id)
      } else {
        appliedShiftsByHoleId.set(entry.pcb_hole_id, entry.shift)
        kept.push({
          pcb_hole_id: entry.pcb_hole_id,
          x: entry.x,
          y: entry.y,
          hole_diameter: holeDiameter,
        })
      }
    }
    return { kept, removedHoleIds, appliedShiftsByHoleId }
  }

  const respectsPitch = (selfIndex: number, p: Point): boolean => {
    const selfInitial = candidates[selfIndex]!.position
    for (let j = 0; j < state.length; j++) {
      if (j === selfIndex) continue
      const other = state[j]!
      if (other.removed) continue
      const initialOther = candidates[j]!.position
      const initialDist = Math.hypot(
        selfInitial.x - initialOther.x,
        selfInitial.y - initialOther.y,
      )
      const requiredPitch = Math.min(minimumDrillPitch, initialDist)
      if (
        Math.hypot(p.x - other.x, p.y - other.y) <
        requiredPitch - PITCH_EPSILON_MM
      ) {
        return false
      }
    }
    return true
  }

  for (let i = 0; i < candidates.length; i++) {
    const entry = state[i]!
    if (entry.removed) continue
    const candidate = candidates[i]!
    const dir = resolvedDirs[i]!
    const currentPos = { x: entry.x, y: entry.y }
    const currentClearance = computeClearancesAtPoint(
      currentPos,
      holeRadius,
      relevantElements,
    )
    if (
      currentClearance.minCopperGap >=
        PREFERRED_MOUSE_BITE_COPPER_CLEARANCE_MM - 1e-6 &&
      currentClearance.minSilkscreenGap >=
        PREFERRED_MOUSE_BITE_SILKSCREEN_CLEARANCE_MM - 1e-6 &&
      respectsPitch(i, currentPos)
    ) {
      continue
    }

    const minShift = entry.shift
    const maxShift = Math.max(minShift, candidate.oppositeEdgeDistance - 0.05)

    const shifts: number[] = [Number(minShift.toFixed(6))]
    const firstGridStep =
      Math.floor(minShift / SHIFT_STEP_MM + 1) * SHIFT_STEP_MM
    for (let s = firstGridStep; s < maxShift - 1e-6; s += SHIFT_STEP_MM) {
      shifts.push(Number(s.toFixed(6)))
    }
    if (maxShift > minShift + 1e-6) {
      shifts.push(Number(maxShift.toFixed(6)))
    }

    let chosen: { pos: Point; shift: number } | null = null
    let fallback: { pos: Point; shift: number } | null = null
    let bestFallbackClearance = Number.NEGATIVE_INFINITY

    for (const s of shifts) {
      const testPos = {
        x: candidate.position.x + dir.x * s,
        y: candidate.position.y + dir.y * s,
      }
      if (!respectsPitch(i, testPos)) continue
      const { minCopperGap, minSilkscreenGap } = computeClearancesAtPoint(
        testPos,
        holeRadius,
        relevantElements,
      )
      if (
        minCopperGap >= PREFERRED_MOUSE_BITE_COPPER_CLEARANCE_MM - 1e-6 &&
        minSilkscreenGap >= PREFERRED_MOUSE_BITE_SILKSCREEN_CLEARANCE_MM - 1e-6
      ) {
        chosen = { pos: testPos, shift: s }
        break
      }
      if (
        minCopperGap >= MIN_MOUSE_BITE_COPPER_CLEARANCE_MM + 1e-4 &&
        minSilkscreenGap >= MIN_MOUSE_BITE_SILKSCREEN_CLEARANCE_MM - 1e-6
      ) {
        const worstClearance = Math.min(minCopperGap, minSilkscreenGap)
        if (worstClearance > bestFallbackClearance + 1e-9) {
          bestFallbackClearance = worstClearance
          fallback = { pos: testPos, shift: s }
        }
      }
    }

    const resolved = chosen ?? fallback
    if (resolved) {
      entry.x = resolved.pos.x
      entry.y = resolved.pos.y
      entry.shift = resolved.shift
    } else {
      entry.removed = true
    }
  }

  const kept: ReconciledPanelMouseBite[] = []
  const removedHoleIds: string[] = []
  for (const entry of state) {
    if (entry.removed) {
      removedHoleIds.push(entry.pcb_hole_id)
    } else {
      appliedShiftsByHoleId.set(entry.pcb_hole_id, entry.shift)
      kept.push({
        pcb_hole_id: entry.pcb_hole_id,
        x: entry.x,
        y: entry.y,
        hole_diameter: holeDiameter,
      })
    }
  }

  return { kept, removedHoleIds, appliedShiftsByHoleId }
}

/**
 * Replaces generic "unnamed hole" labels in DRC diagnostics when the offending
 * non-plated hole is a panel mouse-bite (`panel_mouse_bite_*`).
 */
export function formatPanelMouseBiteDrcDiagnostics<T extends AnyCircuitElement>(
  diagnostics: T[],
): T[] {
  return diagnostics.map((diag) => {
    if (!("message" in diag) || typeof diag.message !== "string") return diag
    const idField =
      ("pcb_trace_error_id" in diag &&
      typeof diag.pcb_trace_error_id === "string"
        ? diag.pcb_trace_error_id
        : "") ||
      ("pcb_placement_error_id" in diag &&
      typeof diag.pcb_placement_error_id === "string"
        ? diag.pcb_placement_error_id
        : "")
    const match = idField.match(
      /((?:pcb_hole_)?panel_mouse_bite_[A-Za-z0-9_]+)\b/,
    )
    if (!match || !diag.message.includes("unnamed hole")) return diag
    const biteId = match[1]!
    return {
      ...diag,
      message: diag.message.replace(
        "unnamed hole",
        `mouse-bite hole (${biteId})`,
      ),
    }
  })
}
