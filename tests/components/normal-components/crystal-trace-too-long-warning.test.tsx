import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces on a crystal net inherit its maximum length and warn when too long", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="30mm">
      <net name="XTAL_IN" />
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="10pF"
        footprint="0402"
        pcbX={-20}
        pcbY={0}
      />
      <chip
        name="U1"
        footprint="soic8"
        pcbX={20}
        pcbY={0}
        pinLabels={{ "1": "XTAL_IN", "2": "GND" }}
      />
      <capacitor
        name="C1"
        capacitance="10pF"
        footprint="0402"
        pcbX={0}
        pcbY={10}
      />
      <trace from=".Y1 > .pin1" to="net.XTAL_IN" />
      <trace from=".U1 > .XTAL_IN" to="net.XTAL_IN" />
      <trace from=".C1 > .pin1" to="net.XTAL_IN" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces.map((trace) => trace.max_length)).toEqual([10, 10, 10])

  const warnings = circuit.db.pcb_trace_too_long_warning.list()
  expect(warnings).toHaveLength(2)
  expect(warnings.map((warning) => warning.source_trace_id).sort()).toEqual(
    [sourceTraces[0].source_trace_id, sourceTraces[1].source_trace_id].sort(),
  )
  expect(
    warnings.every(
      (warning) =>
        warning.maximum_trace_length === 10 &&
        warning.actual_trace_length > warning.maximum_trace_length,
    ),
  ).toBe(true)
})
