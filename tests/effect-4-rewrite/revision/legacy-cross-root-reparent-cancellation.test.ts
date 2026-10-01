import { expect, test } from "bun:test"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Board } from "lib/components/normal-components/Board/Board"
import { Group } from "lib/components/primitive-components/Group/Group"
import { z } from "zod"
import {
  createLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
} from "./loading-fixtures"

test("cross-circuit legacy reparent releases the original owned wait without transferring its records", async () => {
  const originalCircuit = createLoadingRevisionCircuit({
    drcChecksDisabled: true,
  })
  const destinationCircuit = createLoadingRevisionCircuit({
    drcChecksDisabled: true,
  })
  const originalPromise = new Promise<void>(() => {})
  const events: string[] = []
  let callbackStarts = 0
  let callbackCompletions = 0
  let originalSettled = false
  const schema = z.object({ name: z.string() })
  class LegacyWaitComponent extends PrimitiveComponent<typeof schema> {
    override get config() {
      return { componentName: "LegacyWaitComponent", zodProps: schema }
    }

    doInitialSourceRender() {
      this._queueAsyncEffect("revision-legacy-cross-root-wait", async () => {
        callbackStarts++
        events.push("callback_start")
        // No database IDs cross the boundary and this callback never finishes.
        await originalPromise
        callbackCompletions++
      })
    }
  }
  const originalBoard = new Board({ width: 10, height: 10 })
  const destinationBoard = new Board({ width: 10, height: 10 })
  const originalGroup = new Group({ name: "original_group" })
  const destinationGroup = new Group({ name: "destination_group" })
  const component = new LegacyWaitComponent({ name: "legacy_wait" })
  originalGroup.add(component)
  originalBoard.add(originalGroup)
  destinationBoard.add(destinationGroup)
  originalCircuit.add(originalBoard)
  destinationCircuit.add(destinationBoard)
  for (const { circuit, label } of [
    { circuit: originalCircuit, label: "original" },
    { circuit: destinationCircuit, label: "destination" },
  ]) {
    circuit.on("asyncEffect:start", (event) => {
      if (event.effectName === "revision-legacy-cross-root-wait")
        events.push(`${label}_start`)
    })
    circuit.on("asyncEffect:end", (event) => {
      if (event.effectName === "revision-legacy-cross-root-wait")
        events.push(`${label}_end`)
    })
  }
  // Public rendering establishes both non-null roots before the attachment.
  destinationCircuit.render()
  const settling = originalCircuit.renderUntilSettled().then(() => {
    originalSettled = true
  })
  try {
    await flushLoadingRevisionMicrotasks()
    expect(component.root).toBe(originalCircuit)
    expect(destinationGroup.root).toBe(destinationCircuit)
    expect(originalSettled).toBe(false)
    expect(originalCircuit.effectRuntime.activeJobCount).toBe(1)
    expect(destinationCircuit.effectRuntime.activeJobCount).toBe(0)
    expect(component.getPendingAsyncEffectNames()).toEqual([
      "revision-legacy-cross-root-wait",
    ])
    expect(
      originalCircuit
        .getRunningAsyncEffects()
        .map((effect) => effect.effectName),
    ).toEqual(["revision-legacy-cross-root-wait"])
    expect(destinationCircuit.getRunningAsyncEffects()).toEqual([])

    destinationGroup.add(component)
    await settling
    expect(component.parent).toBe(destinationGroup)
    expect(component.root).toBe(destinationCircuit)
    expect(originalSettled).toBe(true)
    expect(callbackStarts).toBe(1)
    expect(callbackCompletions).toBe(0)
    expect(component.getPendingAsyncEffectNames()).toEqual([])
    expect(originalCircuit.getRunningAsyncEffects()).toEqual([])
    expect(destinationCircuit.getRunningAsyncEffects()).toEqual([])
    expect(originalCircuit.effectRuntime.activeJobCount).toBe(0)
    expect(destinationCircuit.effectRuntime.activeJobCount).toBe(0)
    expect(originalCircuit.isDoneRendering()).toBe(true)
    expect(events).toEqual(["callback_start", "original_start", "original_end"])

    await destinationCircuit.renderUntilSettled()
    await destinationCircuit.dispose()
    expect(destinationCircuit.effectRuntime.isDisposed).toBe(true)
    expect(destinationCircuit.effectRuntime.activeJobCount).toBe(0)
    expect(originalCircuit.effectRuntime.activeJobCount).toBe(0)
    expect(originalCircuit.getRunningAsyncEffects()).toEqual([])
    expect(destinationCircuit.getRunningAsyncEffects()).toEqual([])
    expect(component.getPendingAsyncEffectNames()).toEqual([])
    expect(callbackStarts).toBe(1)
    expect(callbackCompletions).toBe(0)
    expect(events).toEqual(["callback_start", "original_start", "original_end"])
  } finally {
    await Promise.all([originalCircuit.dispose(), destinationCircuit.dispose()])
    await settling.catch(() => {})
  }
})
