import { expect, spyOn, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { Board } from "lib/components/normal-components/Board/Board"
import { corePromise } from "lib/effect/core-error"

class NotificationActor extends Renderable {
  constructor(readonly root: RootCircuit) {
    super({})
  }
}

test("an async-end observer failure is diagnosed once without another terminal event or stranded phase records", async () => {
  const circuit = new RootCircuit()
  circuit.add(new Board({ width: 10, height: 10, schematicDisabled: true }))
  const actor = new NotificationActor(circuit)
  const diagnostic = spyOn(console, "error").mockImplementation(() => {})
  const observerFailure = new Error("completion observer sentinel")
  let endEvents = 0
  let release!: () => void
  circuit.on("asyncEffect:end", (payload) => {
    if (payload.effectName !== "notification") return
    endEvents++
    throw observerFailure
  })
  try {
    actor._currentRenderPhase = "SourceRender"
    actor._queueEffect("notification", () =>
      corePromise(
        () =>
          new Promise<void>((resolve) => {
            release = resolve
          }),
      ),
    )
    const settled = circuit.renderUntilSettled()
    release()
    await settled
    expect(endEvents).toBe(1)
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
    expect(circuit._hasIncompleteAsyncEffectsForPhase("SourceRender")).toBe(
      false,
    )
    expect(actor.getPendingAsyncEffectNames()).toEqual([])
    expect(circuit.isDoneRendering()).toBe(true)
    expect(diagnostic).toHaveBeenCalledTimes(1)
    expect(diagnostic.mock.calls[0][0]).toContain(
      "Async effect completion notification error",
    )
    expect(diagnostic.mock.calls[0][0]).toContain(observerFailure.message)
  } finally {
    diagnostic.mockRestore()
    await circuit.dispose()
  }
})
