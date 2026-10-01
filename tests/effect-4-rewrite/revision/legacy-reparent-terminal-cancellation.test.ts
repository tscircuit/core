import { expect, test } from "bun:test"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Board } from "lib/components/normal-components/Board/Board"
import { Group } from "lib/components/primitive-components/Group/Group"
import { CircuitDisposedError } from "lib/effect/circuit-runtime"
import { z } from "zod"
import {
  createLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
} from "./loading-fixtures"

test("a same-circuit legacy reparent keeps waiting until removal or disposal releases its owned wait", async () => {
  for (const terminal of ["removed", "disposed"]) {
    // An ID-free lifetime fixture does not participate in geometry/layout.
    const circuit = createLoadingRevisionCircuit({
      drcChecksDisabled: true,
      pcbDisabled: true,
      schematicDisabled: true,
    })
    const originalPromise = new Promise<void>(() => {})
    const events: string[] = []
    let callbackStarts = 0
    let callbackCompletions = 0
    let settlementFinished = false
    const schema = z.object({ name: z.string() })
    class LegacyWaitComponent extends PrimitiveComponent<typeof schema> {
      override get config() {
        return { componentName: "LegacyWaitComponent", zodProps: schema }
      }

      doInitialSourceRender() {
        this._queueAsyncEffect("revision-legacy-terminal-wait", async () => {
          callbackStarts++
          events.push("callback_start")
          // This external callback has no cancellation contract and never ends.
          await originalPromise
          callbackCompletions++
        })
      }
    }
    const board = new Board({ width: 10, height: 10 })
    const originalGroup = new Group({ name: "original_group" })
    const destinationGroup = new Group({ name: "destination_group" })
    const component = new LegacyWaitComponent({ name: "legacy_wait" })
    originalGroup.add(component)
    board.add(originalGroup)
    board.add(destinationGroup)
    circuit.add(board)
    circuit.on("asyncEffect:start", (event) => {
      if (event.effectName === "revision-legacy-terminal-wait")
        events.push("async_start")
    })
    circuit.on("asyncEffect:end", (event) => {
      if (event.effectName === "revision-legacy-terminal-wait")
        events.push("async_end")
    })
    circuit.on("renderComplete", () => events.push("render_complete"))
    const settling = circuit.renderUntilSettled().then(
      (): { kind: "settled" } => {
        settlementFinished = true
        return { kind: "settled" }
      },
      (cause: unknown): { kind: "failed"; cause: unknown } => {
        settlementFinished = true
        return { kind: "failed", cause }
      },
    )
    try {
      await flushLoadingRevisionMicrotasks()
      if (settlementFinished) {
        const initialOutcome = await settling
        if (initialOutcome.kind === "failed")
          console.error(
            "Initial legacy terminal-control render failed:",
            initialOutcome.cause,
          )
      }
      expect(settlementFinished).toBe(false)
      const registrationRoot = component.root
      expect(registrationRoot).toBe(circuit)
      expect(circuit.effectRuntime.activeJobCount).toBe(1)
      expect(component.getPendingAsyncEffectNames()).toEqual([
        "revision-legacy-terminal-wait",
      ])

      destinationGroup.add(component)
      events.push("reparented")
      await flushLoadingRevisionMicrotasks()
      expect(component.parent).toBe(destinationGroup)
      expect(component.root).toBe(registrationRoot)
      expect(settlementFinished).toBe(false)
      expect(circuit.effectRuntime.activeJobCount).toBe(1)
      expect(component.getPendingAsyncEffectNames()).toEqual([
        "revision-legacy-terminal-wait",
      ])
      expect(
        circuit.getRunningAsyncEffects().map((effect) => effect.effectName),
      ).toEqual(["revision-legacy-terminal-wait"])
      expect(events).toEqual(["callback_start", "async_start", "reparented"])

      if (terminal === "removed") {
        events.push("removing")
        destinationGroup.remove(component)
      } else {
        events.push("disposing")
        await circuit.dispose()
      }
      const outcome = await settling
      expect(settlementFinished).toBe(true)
      expect(callbackStarts).toBe(1)
      expect(callbackCompletions).toBe(0)
      expect(circuit.effectRuntime.activeJobCount).toBe(0)
      expect(component.getPendingAsyncEffectNames()).toEqual([])
      expect(circuit.getRunningAsyncEffects()).toEqual([])
      expect(circuit.effectRuntime.isDisposed).toBe(terminal === "disposed")
      if (terminal === "removed") {
        expect(outcome.kind).toBe("settled")
        expect(events).toEqual([
          "callback_start",
          "async_start",
          "reparented",
          "removing",
          "async_end",
          "render_complete",
        ])
      } else {
        expect(outcome.kind).toBe("failed")
        if (outcome.kind === "failed")
          expect(outcome.cause).toBeInstanceOf(CircuitDisposedError)
        expect(events).toEqual([
          "callback_start",
          "async_start",
          "reparented",
          "disposing",
          "async_end",
        ])
      }
      // Terminal cleanup must remain idempotent while the callback still waits.
      await circuit.dispose()
      expect(circuit.effectRuntime.activeJobCount).toBe(0)
      expect(events.filter((event) => event === "async_end")).toHaveLength(1)
      expect(callbackCompletions).toBe(0)
    } finally {
      await circuit.dispose()
      await settling
    }
  }
})
