import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A real placement mistake still raises the error. Only sub-tolerance
// overhang is suppressed.
test("board overhang above tolerance still raises an out-of-board error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={2} height={2} routingDisabled>
      {/* R1 bounding box extends ~0.68mm past the right edge (x = 1). */}
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        pcbX={0.9}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const outOfBoardErrors = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_component_outside_board_error")
  expect(outOfBoardErrors).toHaveLength(1)
  expect(outOfBoardErrors[0].message).toMatch(
    /extends outside board boundaries/,
  )
})
