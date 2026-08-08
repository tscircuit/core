import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit trace maxLength overrides the inferred decoupling limit", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={3} />
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-3}
        pinLabels={{
          1: "VBAT",
          4: "GND",
        }}
        pinAttributes={{
          VBAT: { requiresPower: true },
        }}
      />
      <trace
        name="POWER_TO_DECOUPLING"
        from=".U1 > .VBAT"
        to=".C1 > .1"
        maxLength="5.5mm"
      />
      <trace from=".C1 > .2" to="net.GND" />
      <trace from=".U1 > .GND" to="net.GND" />
      <pcbnotetext text="Explicit trace maxLength: 5.5mm" pcbX={0} pcbY={7} />
    </board>,
  )

  circuit.render()

  expect(
    circuit.db.source_trace.getWhere({ name: "POWER_TO_DECOUPLING" })
      ?.max_length,
  ).toBe(5.5)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
