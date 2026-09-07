import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an already aborted render does not start rendering", async () => {
  const { circuit } = getTestFixture()
  const controller = new AbortController()
  const reason = new Error("Canceled before rendering")
  circuit.add(<board width={10} height={10} />)
  controller.abort(reason)
  await expect(
    circuit.renderUntilSettled({ signal: controller.signal }),
  ).rejects.toBe(reason)
  expect(circuit.db.toArray()).toHaveLength(0)
})
