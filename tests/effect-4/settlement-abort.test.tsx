import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("abort releases the settlement listener and timer while the footprint job continues", async () => {
  let releaseFootprint!: (result: {
    footprintCircuitJson: typeof external0402Footprint
  }) => void
  const { circuit } = getTestFixture({
    platform: {
      routingDisabled: true,
      footprintLibraryMap: {
        custom: () =>
          new Promise((resolve) => {
            releaseFootprint = resolve
          }),
      },
    },
  })
  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="custom:R_0402" />
    </board>,
  )
  const controller = new AbortController()
  const reason = new Error("caller stopped waiting")
  const complete = spyOn(circuit, "emit")
  const clearTimer = spyOn(globalThis, "clearTimeout")
  try {
    const settled = circuit.renderUntilSettled({ signal: controller.signal })
    const rejected = settled.catch((error: unknown) => error)
    expect(circuit.getRunningAsyncEffects()).toHaveLength(1)
    expect(circuit._eventListeners["asyncEffect:end"]).toHaveLength(1)
    controller.abort(reason)
    expect(await rejected).toBe(reason)
    expect(clearTimer).toHaveBeenCalled()
    expect(circuit._eventListeners["asyncEffect:end"]).toHaveLength(0)
    expect(circuit.getRunningAsyncEffects()).toHaveLength(1)
    expect(
      complete.mock.calls.filter(([event]) => event === "renderComplete"),
    ).toHaveLength(0)
    releaseFootprint({ footprintCircuitJson: external0402Footprint })
    await circuit.renderUntilSettled()
    expect(circuit.isDoneRendering()).toBe(true)
    expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
    expect(
      complete.mock.calls.filter(([event]) => event === "renderComplete"),
    ).toHaveLength(1)
    expect(circuit._eventListeners["asyncEffect:end"]).toHaveLength(0)
  } finally {
    releaseFootprint?.({ footprintCircuitJson: external0402Footprint })
    clearTimer.mockRestore()
    complete.mockRestore()
  }
})
