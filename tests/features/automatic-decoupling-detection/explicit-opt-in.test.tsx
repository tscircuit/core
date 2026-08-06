import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSourceCapacitor } from "./test-utils"

test("shouldHaveDecouplingCapacitor true opts in a nonstandard pin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "SUPPLY_INPUT", pin4: "GND" }}
        pinAttributes={{
          SUPPLY_INPUT: { shouldHaveDecouplingCapacitor: true },
        }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".U1 > .SUPPLY_INPUT" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_port.list().find((port) => port.name === "SUPPLY_INPUT")
      ?.should_have_decoupling_capacitor,
  ).toBe(true)
  expect(getSourceCapacitor(circuit, "C1")?.max_decoupling_trace_length).toBe(1)
})
