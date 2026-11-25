import { expect, test } from "bun:test"
import { annotatePcbBoardBounds } from "tests/fixtures/annotate-pcb-board-bounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("outline offsets: known-bad default-center baseline", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={100}
      height={100}
      outlineOffsetX={-7}
      outlineOffsetY={11}
      outline={[
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 15 },
        { x: 20, y: 15 },
        { x: 20, y: 30 },
        { x: 0, y: 30 },
      ]}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={6} pcbY={7} />
      <via pcbX={2} pcbY={3} fromLayer="top" toLayer="bottom" />
      <pcbnotetext pcbX={10} pcbY={20} text="Outline offsets" />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Pin the known-bad default center; the upper fix updates this expectation.
  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    center: { x: -7, y: 11 },
    width: 40,
    height: 30,
    outline: [
      { x: -7, y: 11 },
      { x: 33, y: 11 },
      { x: 33, y: 26 },
      { x: 13, y: 26 },
      { x: 13, y: 41 },
      { x: -7, y: 41 },
    ],
  })
  expect(circuit.db.pcb_component.list()[0].center).toEqual({ x: 6, y: 7 })
  expect(circuit.db.pcb_smtpad.list()).toMatchObject([
    { x: 5.49, y: 7 },
    { x: 6.51, y: 7 },
  ])
  expect(circuit.db.pcb_via.list()[0]).toMatchObject({ x: 2, y: 3 })
  annotatePcbBoardBounds(circuit)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
