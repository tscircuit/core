import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const KEEPOUT_WIDTH = 8
const KEEPOUT_HEIGHT = 4

const keepoutBounds = {
  minX: -KEEPOUT_WIDTH / 2,
  maxX: KEEPOUT_WIDTH / 2,
  minY: -KEEPOUT_HEIGHT / 2,
  maxY: KEEPOUT_HEIGHT / 2,
}

/**
 * Segment against axis-aligned rectangle. Checking the route points alone would
 * miss a straight wire that starts and ends outside the keepout while crossing
 * the middle of it.
 */
const wireSegmentCrossesKeepout = (
  start: { x: number; y: number },
  end: { x: number; y: number },
) => {
  if (start.x < keepoutBounds.minX && end.x < keepoutBounds.minX) return false
  if (start.x > keepoutBounds.maxX && end.x > keepoutBounds.maxX) return false
  if (start.y < keepoutBounds.minY && end.y < keepoutBounds.minY) return false
  if (start.y > keepoutBounds.maxY && end.y > keepoutBounds.maxY) return false

  const sideOfWire = (x: number, y: number) =>
    (end.x - start.x) * (y - start.y) - (end.y - start.y) * (x - start.x)
  const cornerSides = [
    sideOfWire(keepoutBounds.minX, keepoutBounds.minY),
    sideOfWire(keepoutBounds.maxX, keepoutBounds.minY),
    sideOfWire(keepoutBounds.maxX, keepoutBounds.maxY),
    sideOfWire(keepoutBounds.minX, keepoutBounds.maxY),
  ]

  return !(
    cornerSides.every((side) => side > 0) ||
    cornerSides.every((side) => side < 0)
  )
}

test("keepout without layers blocks bottom layer routing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" autorouter="default">
      <keepout
        shape="rect"
        width={`${KEEPOUT_WIDTH}mm`}
        height={`${KEEPOUT_HEIGHT}mm`}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX="-8mm"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX="8mm"
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        text="keepout with no layers prop: bottom route must go around it"
        fontSize="0.4mm"
        pcbX={0}
        pcbY={4.2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(1)

  const wirePoints = pcbTraces[0].route.filter(
    (routePoint) => routePoint.route_type === "wire",
  )
  const crossingWireSegments = wirePoints
    .slice(0, -1)
    .map((wirePoint, wirePointIndex) => [
      wirePoint,
      wirePoints[wirePointIndex + 1],
    ])
    .filter(([start, end]) => wireSegmentCrossesKeepout(start, end))

  expect(crossingWireSegments).toEqual([])

  expect(circuit.db.pcb_keepout.list()[0]).toMatchObject({
    shape: "rect",
    layers: ["top", "bottom"],
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
