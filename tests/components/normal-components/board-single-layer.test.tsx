import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("single-layer board should have only top layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" layers={1}>
      <fuse
        name="F1"
        currentRating="10"
        voltageRating="220"
        pcbX={0}
        pcbY={0}
        footprint="0603"
        layer="bottom"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify that allLayers returns only ["top"]
  const boardComponent = circuit.firstChild
  expect(boardComponent).not.toBeNull()
  if (boardComponent && "allLayers" in boardComponent) {
    expect(boardComponent.allLayers).toEqual(["top"])
  }

  // Verify the board was created with correct layer count
  const boards = circuit.db.pcb_board.list()
  if (boards.length > 0) {
    expect(boards[0].num_layers).toBe(1)
  }
})
