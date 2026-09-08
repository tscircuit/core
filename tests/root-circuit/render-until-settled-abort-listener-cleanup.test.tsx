import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a completed render detaches the caller's cancellation signal", async () => {
  const { circuit } = getTestFixture()
  const controller = new AbortController()
  circuit.add(<board width={10} height={10} />)
  await circuit.renderUntilSettled({ signal: controller.signal })
  controller.abort(new Error("This completed render must not be canceled"))
  expect(() => circuit.render()).not.toThrow()
  expect(circuit.isDoneRendering()).toBe(true)
})
