import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSourceCapacitor } from "./test-utils"

test("explicit maxDecouplingTraceLength overrides the inferred default", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip name="U1" footprint="soic8" pinLabels={{ pin1: "VCORE" }} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        maxDecouplingTraceLength={2}
      />
      <trace from=".U1 > .VCORE" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(getSourceCapacitor(circuit, "C1")?.max_decoupling_trace_length).toBe(2)
  expect(
    circuit.db.source_trace.list().map((trace) => trace.max_length),
  ).toEqual([2, 2])
})
