import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSourceCapacitor } from "./test-utils"

test("existing decouplingFor and decouplingTo props keep working", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip name="U1" footprint="soic8" pinLabels={{ pin1: "PWR" }} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        decouplingFor=".U1 > .PWR"
        decouplingTo="net.GND"
        maxDecouplingTraceLength={2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(2)
  expect(
    circuit.db.source_trace.list().map((trace) => trace.max_length),
  ).toEqual([2, 2])
  expect(getSourceCapacitor(circuit, "C1")?.max_decoupling_trace_length).toBe(2)
})
