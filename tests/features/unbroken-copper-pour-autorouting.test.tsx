import { expect, test } from "bun:test"
import type { PcbTrace, SourceTrace } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const traceHasBottomWireSegment = (trace: PcbTrace) =>
  trace.route.some(
    (routePoint) =>
      routePoint.route_type === "wire" && routePoint.layer === "bottom",
  )

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
        }}
      />
      <chip name="J1" footprint="soic4" pcbX={8.5} pcbY={0} pcbRotation={180} />
      <via
        name="VGND"
        pcbX={0}
        pcbY={0}
        connectsTo="net.GND"
        fromLayer="top"
        toLayer="bottom"
        outerDiameter="0.9mm"
        holeDiameter="0.45mm"
      />
      <copperpour connectsTo="net.GND" layer="bottom" unbroken />
    </board>,
  )

  await circuit.renderUntilSettled()

  const [bottomCopperPour] = circuit.db.pcb_copper_pour.list()
  expect(bottomCopperPour).toBeDefined()
  expect(bottomCopperPour.layer).toBe("bottom")

  const board = circuit._getBoard() as Board | undefined
  expect(board).toBeDefined()
  board!.add(<trace from=".U1 > .pin1" to=".J1 > .pin1" />)
  board!.add(<trace from=".U1 > .pin2" to=".J1 > .pin2" />)

  await circuit.renderUntilSettled()

  const gndNet = circuit.db.source_net.getWhere({ name: "GND" })
  expect(gndNet).toBeDefined()

  const pcbTraceErrors = circuit.db.pcb_trace_error.list()
  expect(pcbTraceErrors).toHaveLength(0)

  const pcbTraces = circuit.db.pcb_trace.list()
  const sourceTraceById = new Map<string, SourceTrace>(
    circuit.db.source_trace
      .list()
      .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace]),
  )

  const nonGndTraces = pcbTraces.filter((trace) => {
    const sourceTrace = trace.source_trace_id
      ? sourceTraceById.get(trace.source_trace_id)
      : null
    return !sourceTrace?.connected_source_net_ids.includes(
      gndNet!.source_net_id,
    )
  })

  expect(nonGndTraces).toHaveLength(2)
  expect(nonGndTraces.filter(traceHasBottomWireSegment)).toHaveLength(0)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    selectableRoot: circuit,
  })

  const bottomPourObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) =>
      obstacle.layers.includes("bottom") &&
      obstacle.connectedTo.includes(gndNet!.source_net_id),
  )

  expect(bottomPourObstacles.length).toBeGreaterThan(0)
  expect(
    bottomPourObstacles.some(
      (obstacle) =>
        Math.abs(obstacle.center.x) < 1 && Math.abs(obstacle.center.y) < 1,
    ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
