import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSourceCapacitor } from "./test-utils"

test("infers decoupling for a nonstandard pin with requiresPower", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VBAT", pin4: "GND" }}
        pinAttributes={{ VBAT: { requiresPower: true } }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".U1 > .VBAT" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_port.list().find((port) => port.name === "VBAT")
      ?.requires_power,
  ).toBe(true)
  expect(getSourceCapacitor(circuit, "C1")?.max_decoupling_trace_length).toBe(1)
  expect(
    circuit.db.source_trace.list().map((trace) => trace.max_length),
  ).toEqual([1, 1])
})
