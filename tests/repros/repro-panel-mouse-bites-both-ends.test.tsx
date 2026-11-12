import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("offset panel tabs have matching mouse-bite rows at both attachment edges", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width={64} height={64} boardGap={3} panelizationMethod="tab-routing">
      <board width={20} height={20} pcbX={-11.5} pcbY={0} routingDisabled>
        <pcbnotetext text="DRILL BOTH TAB ROOTS" fontSize={1} pcbY={-5} />
      </board>
      <board width={20} height={34} pcbX={11.5} pcbY={7} routingDisabled>
        <pcbnotetext text="OFFSET NEIGHBOR" fontSize={1} />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole) => hole.hole_shape === "circle")
  // Circuit-world mm (+X right/+Y up, right-handed +Z above). The shared
  // channel is 3 mm wide; the open channel above the left board is 2 mm wide.
  const sharedBoardRow = holes.filter(
    (hole) => Math.abs(hole.x + 1.5) < 1e-6 && Math.abs(hole.y) < 3,
  )
  const sharedNeighborRow = holes.filter(
    (hole) => Math.abs(hole.x - 1.5) < 1e-6 && Math.abs(hole.y) < 3,
  )
  expect(sharedBoardRow).toHaveLength(4)
  expect(
    sharedNeighborRow.map((hole) => Number(hole.y.toFixed(6))).sort(),
  ).toEqual(sharedBoardRow.map((hole) => Number(hole.y.toFixed(6))).sort())
  const upperBoardRow = holes.filter(
    (hole) => Math.abs(hole.y - 10) < 1e-6 && Math.abs(hole.x + 11.5) < 3,
  )
  const upperFrameRow = holes.filter(
    (hole) => Math.abs(hole.y - 12) < 1e-6 && Math.abs(hole.x + 11.5) < 3,
  )
  expect(upperBoardRow).toHaveLength(4)
  expect(upperFrameRow.map((hole) => Number(hole.x.toFixed(6))).sort()).toEqual(
    upperBoardRow.map((hole) => Number(hole.x.toFixed(6))).sort(),
  )
})
