import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("lengthMatchTo keeps absolute bounds on the declared bus members", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={20} schematicDisabled autorouter="bus_lanes">
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
        minLength={17}
        maxLength={18}
        maxLengthSkew={6}
        pcbAllowedLayers={["top"]}
      />
      <bus name="CLOCK" connections={["CLK"]} pcbAllowedLayers={["top"]} />
      <pcbnotetext
        text="Clock: 12 mm. DATA: 17-18 mm; lengthMatchTo keeps bounds on DATA."
        pcbY={-6}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const lengths = ["CLK", "DQ"].map((name) => {
    const sourceTraceId = circuit.db.source_trace.getWhere({
      name,
    })!.source_trace_id
    return circuit.db.pcb_trace
      .list()
      .filter((trace) => trace.source_trace_id === sourceTraceId)
      .reduce(
        (total, trace) =>
          total +
          trace.route.slice(1).reduce((sum, point, index) => {
            const previous = trace.route[index]
            if (
              point.route_type !== "wire" ||
              previous.route_type !== "wire" ||
              point.layer !== previous.layer
            )
              return sum
            return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
          }, 0),
        0,
      )
  })
  expect(lengths[0]).toBeCloseTo(12, 6)
  expect(lengths[1]).toBeGreaterThanOrEqual(16.999999)
  expect(lengths[1]).toBeLessThanOrEqual(18.000001)
  expect(
    circuit.db.source_bus.getWhere({ name: "DATA" })!.source_trace_ids,
  ).toHaveLength(1)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(
    circuit.db.source_bus.getWhere({ name: "DATA" })!
      .length_match_source_trace_ids,
  ).toEqual([
    circuit.db.source_trace.getWhere({ name: "CLK" })!.source_trace_id,
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
