import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuit from "./assets/simple-circuit.json"

test("subcircuit-circuit-json09", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={simpleCircuit} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
