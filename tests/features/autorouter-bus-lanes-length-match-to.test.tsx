import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("bus_lanes matches a bus selected by lengthMatchTo in the same phase", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={16} schematicDisabled autorouter="bus_lanes">
      <LengthTestTerminal name="CLK_TX" x={-6} y={3} />
      <LengthTestTerminal name="CLK_RX" x={6} y={3} />
      <LengthTestTerminal name="DQ_TX" x={-6} y={-3} />
      <LengthTestTerminal name="DQ_RX" x={2} y={-3} />
      <trace name="CLK" from=".CLK_TX > .pin1" to=".CLK_RX > .pin1" />
      <trace name="DQ" from=".DQ_TX > .pin1" to=".DQ_RX > .pin1" />
      <bus
        name="DATA"
        connections={["DQ"]}
        lengthMatchTo=".CLOCK"
        maxLengthSkew={0.25}
        pcbAllowedLayers={["top"]}
      />
      <bus name="CLOCK" connections={["CLK"]} pcbAllowedLayers={["top"]} />
      <pcbnotetext
        text="DATA lengthMatchTo=.CLOCK; skew <= 0.25 mm"
        pcbY={-6}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(2)
  const lengths = traces.map((trace) =>
    trace.route.slice(1).reduce((sum, point, index) => {
      const previous = trace.route[index]
      if (point.route_type !== "wire" || previous.route_type !== "wire")
        throw new Error("Expected top-layer bus copper")
      return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
    }, 0),
  )
  expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
    0.250001,
  )
  expect(
    circuit.db.source_bus.getWhere({ name: "DATA" })!.source_trace_ids,
  ).toHaveLength(2)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
