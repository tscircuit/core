import { expect, test } from "bun:test"
import {
  computeClearanceBetweenElements,
  su,
} from "@tscircuit/circuit-json-util"
import type { PcbHoleCircle, PcbTrace, Point } from "circuit-json"
import {
  type TrackedPanelMouseBite,
  reconcilePanelMouseBiteClearances,
} from "lib/utils/panels/reconcile-panel-mouse-bite-clearances"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

test("mouse bites stay in their tab, preserve both rows, and report unresolvable clearance", () => {
  // Circuit-world mm: +X right/+Y up, right-handed +Z above. The matrix
  // places points; its rotation alone transforms the outward direction.
  for (const rotation of [0, 90, 180, 270]) {
    for (const layer of ["top", "bottom"] as const) {
      const placement = compose(translate(15, -9), rotateDEG(rotation))
      const placePoint = (position: Point) => applyToPoint(placement, position)
      const hole: PcbHoleCircle = {
        type: "pcb_hole",
        pcb_hole_id: "panel_mouse_bite_inner",
        hole_shape: "circle",
        hole_diameter: 0.5,
        ...placePoint({ x: 0, y: 0 }),
      }
      const farHole: PcbHoleCircle = {
        ...hole,
        pcb_hole_id: "panel_mouse_bite_outer",
        ...placePoint({ x: 2, y: 0 }),
      }
      const trace: PcbTrace = {
        type: "pcb_trace",
        pcb_trace_id: "fixed_edge_copper",
        route: [-2, 2].map((y) => ({
          route_type: "wire",
          ...placePoint({ x: 0.1, y }),
          layer,
          width: 0.2,
        })),
      }
      const db = su([hole, farHole, trace])
      const candidates: TrackedPanelMouseBite[] = [
        {
          pcb_hole_id: hole.pcb_hole_id,
          position: { x: hole.x, y: hole.y },
          outwardNormal: applyToPoint(rotateDEG(rotation), { x: 1, y: 0 }),
          oppositeEdgeDistance: 2,
        },
      ]
      reconcilePanelMouseBiteClearances(db, candidates, true)
      const movedHole = db.pcb_hole.get(hole.pcb_hole_id)!
      expect(computeClearanceBetweenElements(movedHole, trace)).toBeCloseTo(
        0.25,
      )
      expect(
        computeClearanceBetweenElements(movedHole, farHole),
      ).toBeGreaterThan(0.3)
      expect(db.pcb_hole.list()).toHaveLength(2)
      expect(db.pcb_hole.get(farHole.pcb_hole_id)).toEqual(farHole)
      expect(db.pcb_placement_error.list()).toHaveLength(0)

      // Imported footprint labels can cover the entire tab channel. Keep
      // copper clearance feasible even when the estimated ink cannot clear.
      db.pcb_hole.update(hole.pcb_hole_id, { x: hole.x, y: hole.y })
      db.pcb_silkscreen_text.insert({
        text: "R1",
        anchor_position: placePoint({ x: 0.5, y: 0 }),
        anchor_alignment: "center",
        font: "tscircuit2024",
        font_size: 4,
        layer,
        ccw_rotation: rotation,
      })
      reconcilePanelMouseBiteClearances(db, candidates, true)
      expect(
        computeClearanceBetweenElements(
          db.pcb_hole.get(hole.pcb_hole_id)!,
          trace,
        ),
      ).toBeGreaterThanOrEqual(0.2 - 1e-6)
      expect(db.pcb_placement_error.list()).toHaveLength(0)
      const adjustedHoles = structuredClone(db.pcb_hole.list())
      reconcilePanelMouseBiteClearances(db, candidates, true)
      expect(db.pcb_hole.list()).toEqual(adjustedHoles)

      // A trace along the entire channel leaves no safe normal displacement.
      db.pcb_trace.update(trace.pcb_trace_id, {
        route: [0, 2].map((x) => ({
          route_type: "wire",
          ...placePoint({ x, y: 0 }),
          layer,
          width: 0.2,
        })),
      })
      reconcilePanelMouseBiteClearances(db, candidates, false)
      expect(db.pcb_placement_error.list()).toHaveLength(0)
      reconcilePanelMouseBiteClearances(db, candidates, true)
      reconcilePanelMouseBiteClearances(db, candidates, true)
      expect(db.pcb_hole.list()).toEqual(adjustedHoles)
      expect(db.pcb_placement_error.list()).toHaveLength(1)
      const diagnostic = db.pcb_placement_error.list()[0]!
      expect(diagnostic.message).toContain("within its tab")
      expect(diagnostic.message).not.toContain(hole.pcb_hole_id)
    }
  }

  const hole: PcbHoleCircle = {
    type: "pcb_hole",
    pcb_hole_id: "panel_mouse_bite_pour",
    hole_shape: "circle",
    hole_diameter: 0.5,
    x: 0,
    y: 0,
  }
  const db = su([hole])
  db.pcb_copper_pour.insert({
    shape: "rect",
    center: { x: 0, y: 0 },
    width: 0.2,
    height: 4,
    layer: "top",
    covered_with_solder_mask: true,
  })
  reconcilePanelMouseBiteClearances(
    db,
    [
      {
        pcb_hole_id: hole.pcb_hole_id,
        position: { x: 0, y: 0 },
        outwardNormal: { x: 1, y: 0 },
        oppositeEdgeDistance: 2,
      },
    ],
    true,
  )
  expect(db.pcb_hole.get(hole.pcb_hole_id)!.x).toBeCloseTo(0.6)
  expect(db.pcb_placement_error.list()).toHaveLength(0)

  // A curved row's chord can be slightly shorter than its nominal arc pitch.
  // Keep that existing web, but never accept less than the 0.3 mm minimum.
  for (const [diameter, pitch] of [
    [0.9, 1.3495],
    [0.5, 0.79],
  ] as const) {
    const firstHole: PcbHoleCircle = { ...hole, hole_diameter: diameter }
    const nextHole: PcbHoleCircle = {
      ...firstHole,
      pcb_hole_id: "next_drill",
      x: pitch,
    }
    const drills = su([firstHole, nextHole])
    reconcilePanelMouseBiteClearances(
      drills,
      [
        {
          pcb_hole_id: firstHole.pcb_hole_id,
          position: { x: 0, y: 0 },
          outwardNormal: { x: 0, y: 1 },
          oppositeEdgeDistance: 2,
        },
      ],
      true,
    )
    const adjustedDrill = drills.pcb_hole.get(firstHole.pcb_hole_id)!
    if (diameter === 0.9) {
      expect(adjustedDrill).toEqual(firstHole)
    } else {
      expect(
        computeClearanceBetweenElements(adjustedDrill, nextHole),
      ).toBeGreaterThanOrEqual(0.3)
    }
  }
})
