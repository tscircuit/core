import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("async footprint failure retains the logged error, end event and successful settlement", async () => {
  const failure = new Error("footprint service failed")
  const { circuit } = getTestFixture({
    platform: {
      routingDisabled: true,
      footprintLibraryMap: {
        custom: async () => {
          throw failure
        },
      },
    },
  })
  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="custom:R_0402" />
    </board>,
  )
  const errors: string[] = []
  circuit.on("asyncEffect:end", (event: { error: string }) => {
    errors.push(event.error)
  })
  const log = spyOn(console, "error").mockImplementation(() => {})
  try {
    await circuit.renderUntilSettled()
    expect(errors).toEqual([String(failure)])
    expect(log).toHaveBeenCalled()
    expect(circuit.isDoneRendering()).toBe(true)
    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(1)
    expect(circuit.hasEventListener("asyncEffect:end")).toBe(true)
    expect(circuit._eventListeners["asyncEffect:end"]).toHaveLength(1)
  } finally {
    log.mockRestore()
  }
})
