import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: autorouter crosses a closed solderjumper bridge", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="8mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <solderjumper
        name="JP1"
        footprint="solderjumper2_bridged12"
        bridgedPins={[["1", "2"]]}
        pcbRotation={90}
        pcbY={-1}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />

      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
