import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rigid board does not emit flex coverlay color", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} material="fr4" coverlayColor="black" />,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_board.list()[0].coverlay_color).toBeUndefined()
})
