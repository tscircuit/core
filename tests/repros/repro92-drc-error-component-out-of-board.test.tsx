import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro92: component out of board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader name="P1" pinCount={4} pcbX={8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_component_outside_board_error")
  expect(errors.length).toBe(1)
  expect(errors[0].pcb_component_id).toMatch(/^pcb_component_/)
  expect(errors[0].message).toMatch(/extends outside board boundaries/)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
