import { expect, test } from "bun:test"
import { isPointInsidePolygon } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A board with a notch in its top edge, between x = -1 and x = 1 down to y = 1.
const BOARD_OUTLINE = [
  { x: -5, y: -3 },
  { x: 5, y: -3 },
  { x: 5, y: 3 },
  { x: 1, y: 3 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 3 },
  { x: -5, y: 3 },
]

test("silkscreen labels stay on a board with a notched outline", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board outline={BOARD_OUTLINE} routingDisabled>
      <pcbnotetext
        pcbY={3.6}
        fontSize={0.4}
        text="R1's default label falls in the notch: it moves onto the board"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  expect(isPointInsidePolygon(label.anchor_position, BOARD_OUTLINE)).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
