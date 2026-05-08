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

  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbVias.length).toBe(
    arduinoUnoCircuitJson.filter((elm) => elm.type === "pcb_via").length,
  )

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 15_000)
