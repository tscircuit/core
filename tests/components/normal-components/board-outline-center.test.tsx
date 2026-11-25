import { expect, test } from "bun:test"
import { annotatePcbBoardBounds } from "tests/fixtures/annotate-pcb-board-bounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("outline center: known-bad standalone baseline", async () => {
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
    />,
  )
  await circuit.renderUntilSettled()

  // Pin the known-bad default center; the upper fix updates this expectation.
  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
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
  const snapshotOptions = annotatePcbBoardBounds(circuit, {
    title: "Default outline center",
    viewport: { minX: -30, minY: -20, maxX: 50, maxY: 40 },
    gridStepMm: 10,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, snapshotOptions)
})
