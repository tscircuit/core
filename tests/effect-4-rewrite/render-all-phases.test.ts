import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { orderedRenderPhases } from "lib/effect/render-phase-definitions"
import { RenderLedger, attachRenderChild } from "./render-helpers"

test("the lazy Effect cycle runs all 69 phases in child-first order with matching lifecycle events", () => {
  const ledger: string[] = []
  const parent = new RenderLedger({ name: "parent", ledger })
  const left = new RenderLedger({ name: "left", ledger })
  const right = new RenderLedger({ name: "right", ledger })
  const nested = new RenderLedger({ name: "nested", ledger })
  attachRenderChild(parent, left)
  attachRenderChild(parent, right)
  attachRenderChild(left, nested)
  const program = parent.runRenderCycleEffect()
  expect(ledger).toEqual([])
  expect(orderedRenderPhases).toHaveLength(69)
  Effect.runSync(program)
  expect(ledger).toEqual(
    orderedRenderPhases.flatMap((phase) =>
      ["nested", "left", "right", "parent"].flatMap((name) => [
        `start:${phase}:${name}`,
        `doInitial:${phase}:${name}`,
        `end:${phase}:${name}`,
      ]),
    ),
  )
  expect(parent.getCurrentRenderPhase()).toBe(orderedRenderPhases.at(-1)!)
  expect(
    Object.values(parent.renderPhaseStates).every((state) => state.initialized),
  ).toBe(true)
})
