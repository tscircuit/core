import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multi-board DRC: panel with two boards, each has component outside board error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel layoutMode="grid">
      <board width="10mm" height="10mm">
        <resistor name="R2" resistance="1k" footprint="0603" pcbY={10} />
        <resistor name="R3" resistance="1k" footprint="0603" pcbY={-4} />
        <resistor name="R4" resistance="1k" footprint="0603" pcbY={4} />
        <trace from={".R3 > .pin1"} to={".R4 > .pin2"} />
      </board>
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance="1k" footprint="0402" pcbY={10} />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_component_outside_board_error")

  expect(errors.length).toBe(2)
  expect(errors[0].pcb_board_id != errors[1].pcb_board_id).toBeTrue()
})
