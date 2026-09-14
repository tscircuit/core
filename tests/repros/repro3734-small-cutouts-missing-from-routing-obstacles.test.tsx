import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/core/issues/3734
// The pcb_cutout branches of getObstaclesFromCircuitJson sample the shape with
// a fixed 0.6 mm band (fillPolygonWithRects / fillCircleWithRects). For a
// positive-size cutout whose vertical extent is smaller than that band, the
// first sample point lies outside the shape, so the helper emits no rectangle
// and the cutout silently disappears from the autorouter obstacles.
//
// After a fix that caps the effective band to the shape's vertical extent,
// each cutout below should be represented by rect obstacle(s) covering it
// (all board layers, empty connectivity). Update these assertions when the
// sampling is fixed.

test("repro3734: thin polygon and small circle cutouts produce no obstacles", () => {
  // Exact inputs from the issue: a 2 mm x 0.2 mm polygon slot and a
  // 0.2 mm-diameter circle. Both currently return [].
  const thinSlotObstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_cutout",
      pcb_cutout_id: "thin-slot",
      shape: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 0.2 },
        { x: 0, y: 0.2 },
      ],
    },
  ])
  expect(thinSlotObstacles).toEqual([])

  const smallCircleObstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_cutout",
      pcb_cutout_id: "small-circle",
      shape: "circle",
      center: { x: 0, y: 0 },
      radius: 0.1,
    },
  ])
  expect(smallCircleObstacles).toEqual([])
})

test("repro3734: small cutouts missing from simple route json obstacles", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm" routingDisabled>
      <resistor resistance="1k" footprint="0402" name="R1" pcbX={-4} pcbY={4} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        pcbX={4}
        pcbY={4}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      {/* 2 mm x 0.2 mm slot centered at the board origin */}
      <cutout
        shape="polygon"
        points={[
          { x: -1, y: -0.1 },
          { x: 1, y: -0.1 },
          { x: 1, y: 0.1 },
          { x: -1, y: 0.1 },
        ]}
      />
      {/* 0.2 mm-diameter circle at (0, -3) */}
      <cutout shape="circle" radius="0.1mm" pcbX="0mm" pcbY="-3mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Both cutouts made it into the Circuit JSON...
  expect(circuit.db.pcb_cutout.list()).toHaveLength(2)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  // ...and the pad obstacles prove the obstacle pipeline ran.
  expect(simpleRouteJson.obstacles.length).toBeGreaterThan(0)

  // Currently no obstacle falls anywhere inside the thin slot (|y| <= 0.1,
  // |x| <= 1) or the small circle (center (0,-3), radius 0.1) — the cutouts
  // vanished from the routing input. After the fix there should be rect
  // obstacle(s) covering each region, e.g. a single 2 x 0.2 rect centered at
  // (0, 0) for the slot and a 0.2 x 0.2 rect centered at (0, -3) for the
  // circle, each with empty connectivity and all board layers.
  const slotRegionObstacles = simpleRouteJson.obstacles.filter(
    (o) =>
      Math.abs(o.center.x) <= 1 &&
      Math.abs(o.center.y) <= 0.1 &&
      o.width > 0 &&
      o.height > 0,
  )
  expect(slotRegionObstacles).toHaveLength(0)

  const circleRegionObstacles = simpleRouteJson.obstacles.filter((o) => {
    const dx = o.center.x - 0
    const dy = o.center.y - -3
    return Math.hypot(dx, dy) <= 0.1 && o.width > 0 && o.height > 0
  })
  expect(circleRegionObstacles).toHaveLength(0)
})
