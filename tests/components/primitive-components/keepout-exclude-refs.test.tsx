import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepout excludeRefs suppresses only matching manual trace DRC errors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="12mm">
      <pcbnotetext
        text="Only the manual ANT1 feed violation is excluded"
        pcbX={-10}
        pcbY={5}
        fontSize={0.5}
        anchorAlignment="top_left"
      />
      <testpoint
        name="SOURCE"
        footprintVariant="pad"
        schX={-3}
        schY={1}
        pcbX={-7}
        pcbY={0}
      />
      <testpoint
        name="ANT1"
        footprintVariant="pad"
        schX={3}
        schY={1}
        pcbX={4}
        pcbY={0}
      />
      <testpoint
        name="OTHER_SOURCE"
        footprintVariant="pad"
        schX={-3}
        schY={-1}
        pcbX={-7}
        pcbY={-2}
      />
      <testpoint
        name="OTHER_TARGET"
        footprintVariant="pad"
        schX={3}
        schY={-1}
        pcbX={4}
        pcbY={-2}
      />
      <keepout
        shape="rect"
        width="8mm"
        height="6mm"
        pcbX={4}
        pcbY={0}
        excludeRefs={[".ANT1"]}
      />
      <trace
        name="ANTENNA_FEED"
        from=".SOURCE > .pin1"
        to=".ANT1 > .pin1"
        pcbPath={[{ x: 7, y: 0 }]}
      />
      <trace
        name="OTHER_TRACE"
        from=".OTHER_SOURCE > .pin1"
        to=".OTHER_TARGET > .pin1"
        pcbPath={[{ x: 7, y: 0 }]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild
  if (!board) throw new Error("Expected a board component")

  const antennaFeedSourceTrace = circuit.db.source_trace.getWhere({
    name: "ANTENNA_FEED",
  })
  const otherSourceTrace = circuit.db.source_trace.getWhere({
    name: "OTHER_TRACE",
  })
  const antennaFeedPcbTrace = circuit.db.pcb_trace.getWhere({
    source_trace_id: antennaFeedSourceTrace!.source_trace_id,
  })
  const otherPcbTrace = circuit.db.pcb_trace.getWhere({
    source_trace_id: otherSourceTrace!.source_trace_id,
  })
  const keepout = circuit.db.pcb_keepout.list()[0]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: keepout!.subcircuit_id,
    subcircuitComponent: board,
  })
  const keepoutObstacle = simpleRouteJson.obstacles.find(
    (obstacle) =>
      obstacle.center.x === keepout!.center.x &&
      obstacle.center.y === keepout!.center.y &&
      obstacle.width === 8 &&
      obstacle.height === 6,
  )
  const traceErrors = circuit.db.pcb_trace_error.list()

  expect(keepoutObstacle?.connectedTo).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(
    traceErrors.some(
      (error) => error.pcb_trace_id === antennaFeedPcbTrace!.pcb_trace_id,
    ),
  ).toBe(false)
  expect(
    traceErrors.some(
      (error) => error.pcb_trace_id === otherPcbTrace!.pcb_trace_id,
    ),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
