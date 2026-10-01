import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an already-aborted settlement has no render or metadata side effects", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<board />)
  const render = spyOn(circuit, "render")
  const controller = new AbortController()
  controller.abort()
  try {
    expect(
      await circuit
        .renderUntilSettled({ signal: controller.signal })
        .catch((error: unknown) => error),
    ).toBe(controller.signal.reason)
    expect(render).not.toHaveBeenCalled()
    expect(circuit.db.source_project_metadata.list()).toHaveLength(0)
    expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
  } finally {
    render.mockRestore()
  }
})
