import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boards without a preset do not emit a stackup", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<board width={20} height={20} layers={4} />)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
})
