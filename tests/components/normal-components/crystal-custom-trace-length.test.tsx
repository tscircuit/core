import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("configured crystal maximum trace length propagates across its net", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <net name="XTAL_OUT" />
      <net name="UNRELATED" />
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="10pF"
        maxTraceLength="5mm"
      />
      <chip name="U1" pinLabels={{ "1": "XTAL_OUT", "2": "OTHER" }} />
      <capacitor name="C1" capacitance="10pF" />
      <capacitor name="C2" capacitance="10pF" />
      <trace from=".Y1 > .pin1" to="net.XTAL_OUT" />
      <trace from=".U1 > .XTAL_OUT" to="net.XTAL_OUT" />
      <trace from=".C1 > .pin1" to="net.XTAL_OUT" />
      <trace from=".C2 > .pin1" to="net.UNRELATED" />
    </board>,
  )

  circuit.render()

  const sourceTraces = circuit.db.source_trace.list()
  expect(
    Object.fromEntries(
      sourceTraces.map((trace) => [trace.display_name, trace.max_length]),
    ),
  ).toEqual({
    ".Y1 > .pin1 to net.XTAL_OUT": 5,
    ".U1 > .XTAL_OUT to net.XTAL_OUT": 5,
    ".C1 > .pin1 to net.XTAL_OUT": 5,
    ".C2 > .pin1 to net.UNRELATED": undefined,
  })
})
