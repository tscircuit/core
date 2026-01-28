import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel with grid layoutMode positions boards automatically", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel layoutMode="grid" boardGap={2} edgePadding={2}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(3)

  // All boards should be positioned relative to panel
  for (const board of boards) {
    expect(board.position_mode).toBe("relative_to_panel_anchor")
    expect(board).toHaveProperty("display_offset_x")
    expect(board).toHaveProperty("display_offset_y")
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
