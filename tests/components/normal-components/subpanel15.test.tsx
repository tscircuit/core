import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel with edge padding properties", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="150mm" height="150mm">
      <subpanel
        layoutMode="grid"
        edgePaddingLeft={10}
        edgePaddingRight={5}
        edgePaddingTop={8}
        edgePaddingBottom={3}
      >
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
