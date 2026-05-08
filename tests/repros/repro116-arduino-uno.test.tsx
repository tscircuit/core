import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import arduinoUnoCircuitJson from "tests/repros/assets/arduino-uno-circuit-json.json"

test("repro116: arduino uno trace and via inflation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 15_000)
