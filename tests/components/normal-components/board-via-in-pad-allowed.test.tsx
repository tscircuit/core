import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board isViaInPadAllowed reaches the pcb_board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<board width={20} height={20} isViaInPadAllowed />)

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    is_via_in_pad_allowed: true,
  })
})
