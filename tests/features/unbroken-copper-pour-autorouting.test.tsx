import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

const pourBounds = {
  left: -2.5,
  right: 2.5,
  bottom: -8,
  top: 8,
}

const isPointInsidePourBounds = (point: { x: number; y: number }) =>
  point.x > pourBounds.left &&
  point.x < pourBounds.right &&
  point.y > pourBounds.bottom &&
  point.y < pourBounds.top

const isTopWireRoutePoint = (
  routePoint: PcbTrace["route"][number],
): routePoint is Extract<PcbTrace["route"][number], { route_type: "wire" }> =>
  routePoint.route_type === "wire" && routePoint.layer === "top"

const traceHasTopSegmentInsidePourBounds = (trace: PcbTrace) => {
  for (let i = 0; i < trace.route.length - 1; i++) {
    const from = trace.route[i]
    const to = trace.route[i + 1]

    if (!isTopWireRoutePoint(from) || !isTopWireRoutePoint(to)) {
      continue
    }

    const dx = to.x - from.x
    const dy = to.y - from.y

    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      if (
        isPointInsidePourBounds({
          x: from.x + dx * t,
          y: from.y + dy * t,
        })
      ) {
        return true
      }
    }
  }

  return false
}

test("unbroken copper pour acts as a same-net autorouter obstacle", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="36mm" height="24mm" autorouter="sequential-trace">
      <net name="GND" />
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-7.5}
        pcbY={0}
        connections={{
          pin5: "net.GND",
          pin6: "net.GND",
          pin7: "net.GND",
          pin8: "net.GND",
        }}
      />
      <chip name="J1" footprint="soic4" pcbX={8.5} pcbY={0} pcbRotation={180} />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        unbroken
        outline={[
          { x: pourBounds.left, y: pourBounds.bottom },
          { x: pourBounds.right, y: pourBounds.bottom },
          { x: pourBounds.right, y: pourBounds.top },
          { x: pourBounds.left, y: pourBounds.top },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThan(0)

  const board = (circuit as any)._getBoard()
  expect(board).toBeDefined()
  board.add(<trace from=".U1 > .pin1" to=".J1 > .pin4" />)
  board.add(<trace from=".U1 > .pin2" to=".J1 > .pin3" />)
  board.add(<trace from=".U1 > .pin3" to=".J1 > .pin2" />)
  board.add(<trace from=".U1 > .pin4" to=".J1 > .pin1" />)

  await circuit.renderUntilSettled()

  const gndNet = circuit.db.source_net.getWhere({ name: "GND" })
  expect(gndNet).toBeDefined()

  const pcbTraces = circuit.db.pcb_trace.list()
  const pcbTraceErrors = circuit.db.pcb_trace_error.list()
  expect(pcbTraceErrors).toHaveLength(0)
  const tracesWithBottomSegments = pcbTraces.filter((trace) =>
    trace.route.some(
      (routePoint) =>
        routePoint.route_type === "wire" && routePoint.layer === "bottom",
    ),
  )
  expect(tracesWithBottomSegments).toHaveLength(4)

  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)
  expect(
    vias.filter((via) => isPointInsidePourBounds({ x: via.x, y: via.y })),
  ).toHaveLength(0)

  for (const trace of pcbTraces) {
    expect(traceHasTopSegmentInsidePourBounds(trace)).toBe(false)
  }

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  const pourObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) =>
      obstacle.layers.includes("top") &&
      obstacle.connectedTo.includes(gndNet!.source_net_id) &&
      isPointInsidePourBounds(obstacle.center),
  )

  expect(pourObstacles.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
