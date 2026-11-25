import { expect, test } from "bun:test"
import { annotatePcbBoardBounds } from "tests/fixtures/annotate-pcb-board-bounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("outlined boards retain panel and subpanel placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="none" width={200} height={200} pcbX={30} pcbY={20}>
      <board
        name="B1"
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
        <via pcbX={2} pcbY={3} fromLayer="top" toLayer="bottom" />
        <pcbnotetext pcbX={0} pcbY={20} text="Panel placement" />
      </board>
      <subpanel layoutMode="none" width={100} height={100} pcbX={70} pcbY={50}>
        <board
          name="B2"
          outline={[
            { x: 0, y: 0 },
            { x: 40, y: 0 },
            { x: 40, y: 15 },
            { x: 20, y: 15 },
            { x: 20, y: 30 },
            { x: 0, y: 30 },
          ]}
        >
          <via pcbX={2} pcbY={3} fromLayer="top" toLayer="bottom" />
          <pcbnotetext pcbX={0} pcbY={0} text="Subpanel placement" />
        </board>
      </subpanel>
    </panel>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()).toMatchObject([
    {
      center: { x: 23, y: 31 },
      width: 40,
      height: 30,
      outline: [
        { x: -4, y: 27 },
        { x: 36, y: 27 },
        { x: 36, y: 42 },
        { x: 16, y: 42 },
        { x: 16, y: 57 },
        { x: -4, y: 57 },
      ],
    },
    {
      center: { x: 100, y: 70 },
      width: 40,
      height: 30,
      outline: [
        { x: 80, y: 55 },
        { x: 120, y: 55 },
        { x: 120, y: 70 },
        { x: 100, y: 70 },
        { x: 100, y: 85 },
        { x: 80, y: 85 },
      ],
    },
  ])
  expect(circuit.db.pcb_via.list()).toMatchObject([
    { x: 32, y: 23 },
    { x: 102, y: 73 },
  ])
  annotatePcbBoardBounds(circuit)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
