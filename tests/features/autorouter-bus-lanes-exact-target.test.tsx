import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("bus_lanes enforces zero target tolerance without a skew constraint", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} schematicDisabled routeRemaining={false}>
      <LengthTestTerminal name="TX" x={-6} y={0} />
      <LengthTestTerminal name="RX" x={6} y={0} />
      <trace name="D0" from="TX.pin1" to="RX.pin1" />
      <bus
        name="DATA"
        connections={["D0"]}
        routingPhaseIndex={0}
        targetLength="15mm"
        lengthTolerance={0}
      />
      <autoroutingphase phaseIndex={0} autorouter="bus_lanes" />
      <pcbnotetext
        text="12 mm endpoints; exactly 15 mm routed; no skew setting"
        pcbY={5}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(1)
  const length = traces[0].route.slice(1).reduce((sum, point, index) => {
    const previous = traces[0].route[index]
    if (point.route_type !== "wire" || previous.route_type !== "wire")
      throw new Error("Expected planar route")
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)
  expect(length).toBeCloseTo(15, 7)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
