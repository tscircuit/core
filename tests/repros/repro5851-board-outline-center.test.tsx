import { expect, test } from "bun:test"
import { annotatePcbBoardBounds } from "tests/fixtures/annotate-pcb-board-bounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro5851: outlined board emits a displaced bounding box", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      outline={[
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 15 },
        { x: 20, y: 15 },
        { x: 20, y: 30 },
        { x: 0, y: 30 },
      ]}
    >
      <pcbnotetext
        pcbX={20}
        pcbY={5}
        fontSize={0.7}
        text="Solid: outline | dashed: bounds | yellow: center"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  // Pin the known-bad baseline for #5851; the stacked fix updates this assertion.
  expect(pcbBoard).toMatchObject({
    center: { x: 0, y: 0 },
    width: 40,
    height: 30,
    outline: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 15 },
      { x: 20, y: 15 },
      { x: 20, y: 30 },
      { x: 0, y: 30 },
    ],
  })

  annotatePcbBoardBounds(circuit)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
