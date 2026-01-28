import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel with rows and cols positions boards in specified layout", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel layoutMode="grid" row={1} col={4}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  // All boards should have the same y position (single row)
  const positions = boards.map((b) => b.center)
  const firstY = positions[0].y
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i].y).toBe(firstY)
  }

  // X should be increasing
  for (let i = 0; i < positions.length - 1; i++) {
    expect(positions[i].x).toBeLessThan(positions[i + 1].x)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
