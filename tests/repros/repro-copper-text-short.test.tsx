import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Point = { x: number; y: number }

function distancePointToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const abLenSq = abx * abx + aby * aby
  if (abLenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / abLenSq),
  )
  const projX = a.x + t * abx
  const projY = a.y + t * aby
  return Math.hypot(p.x - projX, p.y - projY)
}

function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function onSegment(a: Point, b: Point, p: Point): boolean {
  return (
    Math.min(a.x, b.x) - 1e-9 <= p.x &&
    p.x <= Math.max(a.x, b.x) + 1e-9 &&
    Math.min(a.y, b.y) - 1e-9 <= p.y &&
    p.y <= Math.max(a.y, b.y) + 1e-9
  )
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const o1 = orient(a, b, c)
  const o2 = orient(a, b, d)
  const o3 = orient(c, d, a)
  const o4 = orient(c, d, b)

  if (
    ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) &&
    ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))
  ) {
    return true
  }
  if (Math.abs(o1) < 1e-9 && onSegment(a, b, c)) return true
  if (Math.abs(o2) < 1e-9 && onSegment(a, b, d)) return true
  if (Math.abs(o3) < 1e-9 && onSegment(c, d, a)) return true
  if (Math.abs(o4) < 1e-9 && onSegment(c, d, b)) return true
  return false
}

function distanceBetweenSegments(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
): number {
  if (segmentsIntersect(a, b, c, d)) return 0
  return Math.min(
    distancePointToSegment(a, c, d),
    distancePointToSegment(b, c, d),
    distancePointToSegment(c, a, b),
    distancePointToSegment(d, a, b),
  )
}

function distanceSegmentToAxisAlignedRect(
  a: Point,
  b: Point,
  rect: { left: number; right: number; bottom: number; top: number },
): number {
  const pointInside = (p: Point) =>
    p.x >= rect.left &&
    p.x <= rect.right &&
    p.y >= rect.bottom &&
    p.y <= rect.top
  if (pointInside(a) || pointInside(b)) return 0

  const corners = {
    bl: { x: rect.left, y: rect.bottom },
    br: { x: rect.right, y: rect.bottom },
    tr: { x: rect.right, y: rect.top },
    tl: { x: rect.left, y: rect.top },
  }
  const edges: Array<[Point, Point]> = [
    [corners.bl, corners.br],
    [corners.br, corners.tr],
    [corners.tr, corners.tl],
    [corners.tl, corners.bl],
  ]

  return Math.min(
    ...edges.map(([e1, e2]) => distanceBetweenSegments(a, b, e1, e2)),
  )
}

test("autorouter avoids coppertext between independent routed nets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm">
      <chip
        name="U1"
        pcbY={3}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              pcbX={-0.4}
              layer="top"
              portHints={["1"]}
            />
            <smtpad
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              pcbX={0.4}
              layer="top"
              portHints={["2"]}
            />
          </footprint>
        }
        pinLabels={{ pin1: "A", pin2: "B" }}
      />
      <chip
        name="U2"
        pcbY={-3}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              pcbX={-0.4}
              layer="top"
              portHints={["1"]}
            />
            <smtpad
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              pcbX={0.4}
              layer="top"
              portHints={["2"]}
            />
          </footprint>
        }
        pinLabels={{ pin1: "A", pin2: "B" }}
      />
      <coppertext
        text="-"
        fontSize={10}
        pcbX={0.5}
        layer="top"
        anchorAlignment="center"
      />
      <trace from=".U1 > .A" to=".U2 > .A" />
      <trace from=".U1 > .B" to=".U2 > .B" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const copperText = circuit.db.pcb_copper_text.list()[0]!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })
  const copperTextObstacle = simpleRouteJson.obstacles.find(
    (obstacle) => obstacle.obstacleId === copperText.pcb_copper_text_id,
  )
  expect(copperTextObstacle).toBeDefined()
  expect(copperTextObstacle?.layers).toEqual(["top"])
  expect(copperTextObstacle?.center.x).toBeCloseTo(0.5, 5)
  expect(copperTextObstacle?.center.y).toBeCloseTo(0, 5)
  expect(copperTextObstacle?.width).toBeCloseTo(2.1432935, 5)
  expect(copperTextObstacle?.height).toBeCloseTo(0.795, 5)

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(2)

  // Rendered "-" copper glyph spans 2.1432935mm x 0.795mm centered at (0.5, 0) on top layer.
  const copperRect = {
    left: 0.5 - 2.1432935 / 2,
    right: 0.5 + 2.1432935 / 2,
    bottom: -0.795 / 2,
    top: 0.795 / 2,
  }

  for (const trace of traces) {
    let minCopperClearance = Number.POSITIVE_INFINITY
    for (let i = 0; i < trace.route.length - 1; i++) {
      const a = trace.route[i]!
      const b = trace.route[i + 1]!
      if (a.route_type !== "wire" || b.route_type !== "wire") continue
      if (a.layer !== "top" || b.layer !== "top") continue

      const edgeDistance = distanceSegmentToAxisAlignedRect(a, b, copperRect)
      const traceRadius = Math.max(a.width, b.width) / 2
      minCopperClearance = Math.min(
        minCopperClearance,
        edgeDistance - traceRadius,
      )
    }
    expect(minCopperClearance).toBeGreaterThan(0)
  }
})

test("getObstaclesFromCircuitJson handles knockout and rotated pcb_copper_text", () => {
  const obstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_copper_text",
      pcb_copper_text_id: "pcb_copper_text_knockout",
      pcb_component_id: "pcb_component_0",
      text: "GND",
      font: "tscircuit2024",
      font_size: 2,
      layer: "bottom",
      anchor_position: { x: 4, y: -2 },
      anchor_alignment: "center",
      ccw_rotation: 90,
      is_knockout: true,
    },
  ])

  expect(obstacles).toHaveLength(1)
  expect(obstacles[0]).toMatchObject({
    obstacleId: "pcb_copper_text_knockout",
    type: "rect",
    layers: ["bottom"],
    center: { x: 4, y: -2 },
    connectedTo: [],
  })
  expect(obstacles[0]!.ccwRotationDegrees).toBeUndefined()
  // At 90deg rotation, the wider horizontal text box becomes taller than wide.
  expect(obstacles[0]!.height).toBeGreaterThan(obstacles[0]!.width)
})
