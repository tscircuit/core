import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("lengthMatchTo includes both dogbone prefixes once", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={16}
      layers={4}
      minTraceWidth={0.1}
      minViaPadDiameter={0.4}
      minViaHoleDiameter={0.2}
      schematicDisabled
      autorouter="bus_lanes"
    >
      <fanout
        pcbX={-6}
        pcbY={3}
        autorouter="dogbone"
        fanoutRoutingLayers={["inner1", "inner2"]}
      >
        <chip name="CLK_TX" pcbX={0} pcbY={0} footprint="bga4_grid2x2_p1mm" />
      </fanout>
      <fanout
        pcbX={6}
        pcbY={3}
        autorouter="dogbone"
        fanoutRoutingLayers={["inner1", "inner2"]}
      >
        <chip name="CLK_RX" pcbX={0} pcbY={0} footprint="bga4_grid2x2_p1mm" />
      </fanout>
      <fanout
        pcbX={-6}
        pcbY={-3}
        autorouter="dogbone"
        fanoutRoutingLayers={["inner1", "inner2"]}
      >
        <chip name="DQ_TX" pcbX={0} pcbY={0} footprint="bga4_grid2x2_p1mm" />
      </fanout>
      <fanout
        pcbX={2}
        pcbY={-3}
        autorouter="dogbone"
        fanoutRoutingLayers={["inner1", "inner2"]}
      >
        <chip name="DQ_RX" pcbX={0} pcbY={0} footprint="bga4_grid2x2_p1mm" />
      </fanout>
      <trace name="CLK" from=".CLK_TX > .pin1" to=".CLK_RX > .pin1" />
      <trace name="DQ" from=".DQ_TX > .pin1" to=".DQ_RX > .pin1" />
      <bus
        name="DATA"
        connections={["DQ"]}
        lengthMatchTo=".CLOCK"
        maxLengthSkew={0.25}
        pcbAllowedLayers={["inner1", "inner2"]}
      />
      <bus
        name="CLOCK"
        connections={["CLK"]}
        pcbAllowedLayers={["inner1", "inner2"]}
      />
      <pcbnotetext
        text="Pad-to-pad matching includes both fixed dogbone prefixes; skew <= 0.25 mm"
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
  expect(Math.min(...lengths)).toBeGreaterThanOrEqual(12)
  expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
    0.250001,
  )
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
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showDebugObjects: false,
    shouldDrawRatsNest: false,
  })
})
