import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verifies is_allowed_to_be_off_board is propagated to pcb_component
// for components that were not serializing this field from allowOffBoard prop.

test("allowOffBoard propagation to pcb_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={20}
        pcbY={0}
        allowOffBoard
      />
      <jumper name="J1" footprint="pinrow4" pcbX={20} pcbY={10} allowOffBoard />
      <solderjumper
        name="SJ1"
        footprint="solderjumper2"
        pcbX={20}
        pcbY={20}
        allowOffBoard
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const name of ["R1", "J1", "SJ1"]) {
    const pcb_component = circuit.db.pcb_component.getWhere({
      source_component_id: circuit.db.source_component.getWhere({ name })
        ?.source_component_id,
    })
    expect(pcb_component?.is_allowed_to_be_off_board).toBe(true)
  }

  const outsideErrors = circuit
    .getCircuitJson()
    .filter((el) => el.type === "pcb_component_outside_board_error")
  expect(outsideErrors.length).toBe(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
