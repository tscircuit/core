import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSourceCapacitor } from "./test-utils"

test("does not infer decoupling through a shared named power net", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin4: "GND" }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".U1 > .VCC" to="net.VCC" />
      <trace from=".C1 > .1" to="net.VCC" />
      <trace from=".C1 > .2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    getSourceCapacitor(circuit, "C1")?.max_decoupling_trace_length,
  ).toBeUndefined()
  expect(
    circuit.db.source_trace
      .list()
      .every((trace) => trace.max_length === undefined),
  ).toBe(true)
})
