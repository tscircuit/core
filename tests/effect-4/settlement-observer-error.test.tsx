import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a throwing renderComplete observer preserves rejection identity", async () => {
  const { circuit } = getTestFixture({ platform: { routingDisabled: true } })
  circuit.add(<board />)
  const failure = new Error("observer failed")
  circuit.on("renderComplete", () => {
    throw failure
  })
  expect(
    await circuit.renderUntilSettled().catch((error: unknown) => error),
  ).toBe(failure)
  expect(circuit.isDoneRendering()).toBe(true)
  expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
})
