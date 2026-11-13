import { point } from "@flatten-js/core"
import {
  type CircuitJsonUtilObjects,
  computeClearanceBetweenElements,
  distanceBetweenShapes,
  getPcbElementBounds,
  getPourPolygon,
} from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbHoleCircle } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type { PanelMouseBiteCandidate } from "./get-panel-mouse-bite-positions"

type PcbHoleId = PcbHoleCircle["pcb_hole_id"]

/** Candidate geometry is in circuit-world mm, +X right/+Y up, right-handed
 * +Z above: position is a point and outwardNormal a unit direction. */
export interface TrackedPanelMouseBite extends PanelMouseBiteCandidate {
  pcb_hole_id: PcbHoleId
}

/** Physical silkscreen envelope in circuit-world mm (+X right/+Y up,
 * right-handed +Z above). Rect centers are points, with CCW world rotations. */
function getSilkscreenClearanceShape(element: AnyCircuitElement) {
  if (!element.type.startsWith("pcb_silkscreen_")) return null
  if (element.type === "pcb_silkscreen_text") {
    const fontSize = element.font_size
    // Paired with circuit-json-to-kicad's createGrTextFromCircuitJson:
    // it emits square font.size and this stroke thickness. Use a conservative
    // stroke-font advance rather than the text anchor or SVG font metrics.
    const stroke = fontSize > 1 ? Math.min(0.3, fontSize * 0.2) : 0.15
    const lines = element.text.split("\n")
    const width =
      Math.max(...lines.map((line) => line.length)) * fontSize * 0.85 + stroke
    const height = fontSize * (1 + (lines.length - 1) * 1.5) + stroke
    const alignment = element.anchor_alignment ?? "center"
    const localCenter = {
      x: alignment.endsWith("left")
        ? width / 2
        : alignment.endsWith("right")
          ? -width / 2
          : 0,
      y: alignment.startsWith("top")
        ? -height / 2
        : alignment.startsWith("bottom")
          ? height / 2
          : 0,
    }
    // SilkscreenText.doInitialPcbPrimitiveRender emits a world anchor and CCW
    // rotation. Compose that transform once for the anchor-relative envelope.
    const center = applyToPoint(
      compose(
        translate(element.anchor_position.x, element.anchor_position.y),
        rotateDEG(element.ccw_rotation ?? 0),
      ),
      localCenter,
    )
    return {
      kind: "rect" as const,
      centerX: center.x,
      centerY: center.y,
      width,
      height,
      rotationDegrees: element.ccw_rotation ?? 0,
    }
  }
  if (element.type === "pcb_silkscreen_line") {
    return {
      kind: "rect" as const,
      centerX: (element.x1 + element.x2) / 2,
      centerY: (element.y1 + element.y2) / 2,
      width:
        Math.hypot(element.x2 - element.x1, element.y2 - element.y1) +
        element.stroke_width,
      height: element.stroke_width,
      rotationDegrees:
        (Math.atan2(element.y2 - element.y1, element.x2 - element.x1) * 180) /
        Math.PI,
    }
  }
  const bounds = getPcbElementBounds(element)
  if (!bounds) return null
  const stroke =
    "stroke_width" in element ? Number(element.stroke_width ?? 0) : 0
  return {
    kind: "rect" as const,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
    width: bounds.maxX - bounds.minX + stroke,
    height: bounds.maxY - bounds.minY + stroke,
    rotationDegrees: 0,
  }
}

/** Move generated drill points only along their own tab channel, in
 * circuit-world mm (+X right/+Y up, right-handed +Z above). Keep both tab
 * roots and drill spacing; report an obstruction instead of deleting drills.
 * Run after manual copper exists and before board routing / final DRC. */
export function reconcilePanelMouseBiteClearances(
  db: CircuitJsonUtilObjects,
  candidates: TrackedPanelMouseBite[],
  reportConflicts: boolean,
): void {
  if (!candidates.length) return
  const elements = db.toArray()
  const copper = elements.filter(
    (element) =>
      element.type === "pcb_trace" ||
      element.type === "pcb_smtpad" ||
      element.type === "pcb_via" ||
      element.type === "pcb_plated_hole",
  )
  // The generic clearance utility does not decompose pours. Use the canonical
  // polygon helper so filled regions, curved edges, and voids remain physical.
  const copperPours = db.pcb_copper_pour.list().map(getPourPolygon)
  const silkscreen = elements.flatMap((element) => {
    const shape = getSilkscreenClearanceShape(element)
    return shape ? [shape] : []
  })
  const holes = db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")

  for (const candidate of candidates) {
    const holeIndex = holes.findIndex(
      (hole) => hole.pcb_hole_id === candidate.pcb_hole_id,
    )
    const hole = holes[holeIndex]!
    const minimumShift = Math.max(
      0,
      (hole.x - candidate.position.x) * candidate.outwardNormal.x +
        (hole.y - candidate.position.y) * candidate.outwardNormal.y,
    )
    // Each attachment row stays in its half of the channel. In particular a
    // shift cannot cross the far attachment edge into the neighboring board.
    const maximumShift = candidate.oppositeEdgeDistance / 2
    let resolved: PcbHoleCircle | undefined
    for (const [copperClearance, silkClearance] of [
      [0.25, 0.12],
      [0.2, 0.1],
      // Copper and drill clearance take priority when an estimated ink
      // envelope covers the available tab channel.
      [0.2, 0],
    ] as const) {
      const steps = Math.ceil(Math.max(0, maximumShift - minimumShift) / 0.025)
      for (let step = 0; step <= steps; step++) {
        const shift = Math.min(maximumShift, minimumShift + step * 0.025)
        const proposedHole = {
          ...hole,
          x: candidate.position.x + candidate.outwardNormal.x * shift,
          y: candidate.position.y + candidate.outwardNormal.y * shift,
        }
        if (
          copper.some(
            (element) =>
              computeClearanceBetweenElements(proposedHole, element) <
              copperClearance - 1e-6,
          )
        )
          continue
        if (
          copperPours.some((pour) => {
            const center = point(proposedHole.x, proposedHole.y)
            return (
              pour.contains(center) ||
              pour.distanceTo(center)[0] - proposedHole.hole_diameter / 2 <
                copperClearance - 1e-6
            )
          })
        )
          continue
        if (
          silkscreen.some(
            (shape) =>
              distanceBetweenShapes(
                {
                  kind: "circle",
                  x: proposedHole.x,
                  y: proposedHole.y,
                  radius: proposedHole.hole_diameter / 2,
                },
                shape,
              ) <
              silkClearance - 1e-6,
          )
        )
          continue
        if (
          holes.some(
            (otherHole) =>
              otherHole.pcb_hole_id !== hole.pcb_hole_id &&
              computeClearanceBetweenElements(proposedHole, otherHole) <
                Math.max(
                  0.3,
                  // Curved rows have a slightly smaller chord pitch than
                  // their nominal arc pitch. Preserve their existing web
                  // rather than shifting otherwise unobstructed tab roots.
                  Math.min(
                    computeClearanceBetweenElements(hole, otherHole),
                    Math.max(hole.hole_diameter, otherHole.hole_diameter) / 2,
                  ),
                ) -
                  1e-6,
          )
        )
          continue
        resolved = proposedHole
        break
      }
      if (resolved) break
    }
    if (resolved) {
      holes[holeIndex] = resolved
      if (resolved.x !== hole.x || resolved.y !== hole.y) {
        db.pcb_hole.update(hole.pcb_hole_id, { x: resolved.x, y: resolved.y })
      }
    } else if (reportConflicts) {
      const message = `Mouse-bite hole at (${hole.x.toFixed(2)}, ${hole.y.toFixed(2)}) mm cannot clear nearby copper or drills within its tab. Increase the tab width or move the nearby geometry.`
      if (
        !db.pcb_placement_error
          .list()
          .some((error) => error.message === message)
      ) {
        db.pcb_placement_error.insert({
          error_type: "pcb_placement_error",
          message,
        })
      }
    }
  }
}
