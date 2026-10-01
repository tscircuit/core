import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("render exceptions reject asynchronously with the original thrown object or primitive", async () => {
  for (const failure of [
    new Error("render failed"),
    "render failed",
    undefined,
  ]) {
    const { circuit } = getTestFixture()
    const ownKeys = failure instanceof Error ? Reflect.ownKeys(failure) : []
    const stack = failure instanceof Error ? failure.stack : undefined
    circuit.render = () => {
      throw failure
    }
    let settled!: Promise<void>
    expect(() => {
      settled = circuit.renderUntilSettled()
    }).not.toThrow()
    const rejected = await settled.then(
      () => ({ failed: false }),
      (error: unknown) => ({ failed: true, error }),
    )
    expect(rejected).toEqual({ failed: true, error: failure })
    if ("error" in rejected) expect(rejected.error).toBe(failure)
    if (failure instanceof Error) {
      expect(Reflect.ownKeys(failure)).toEqual(ownKeys)
      expect(failure.stack).toBe(stack)
    }
    expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
  }
})
