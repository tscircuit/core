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
    />,
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

  const snapshotOptions = annotatePcbBoardBounds(circuit, {
    title: "Issue #5851: default outline center",
    viewport: { minX: -30, minY: -20, maxX: 50, maxY: 40 },
    gridStepMm: 10,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, snapshotOptions)
})
