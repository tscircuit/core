import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces on a crystal net inherit their maximum length and skip impossible autorouting", async () => {
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

  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_too_long_warning.list()).toHaveLength(0)

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toContain("cannot be satisfied")
  expect(autoroutingErrors[0].message).toContain("2 additional violations")
})
