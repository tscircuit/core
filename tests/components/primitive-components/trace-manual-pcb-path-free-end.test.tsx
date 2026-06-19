import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath can extend outward from a 0402 resistor port without connecting to another port", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="qfn32" />
      <trace
        path={[".U1 > .pin1"]}
        pcbPathRelativeTo=".U1 > .pin1"
        pcbPath={[
          { x: -3.5, y: 1.75 },
          { x: -3.5, y: 2.5 },
          { x: -4, y: 2.5 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
