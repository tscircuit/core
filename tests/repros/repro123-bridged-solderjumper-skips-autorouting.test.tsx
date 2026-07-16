import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("bridged solderjumper does not prevent autorouting", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <solderjumper
        name="JP1"
        footprint="solderjumper2_bridged12"
        bridgedPins={[["1", "2"]]}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />

      <trace from=".R1 > .pin1" to=".JP1 > .pin1" />
      <trace from=".JP1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
