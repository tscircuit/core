import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty string in connections does not crash render (#2865)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await expect(circuit.renderUntilSettled()).resolves.toBeUndefined()

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces.length).toBe(1)
})
