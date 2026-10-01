import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { Renderable } from "lib/components/base-components/Renderable"
import { orderedRenderPhases } from "lib/effect/render-phase-definitions"
import { attachRenderChild } from "./render-helpers"

class CountingPhases extends Renderable {
  writes = 0
  doInitialSourceRender() {
    this.writes++
  }
}

test("a large native Effect cycle commits its entire synchronous prefix beyond Effect's 2048-operation yield budget", async () => {
  const parent = new CountingPhases({})
  const children = Array.from({ length: 24 }, () => new CountingPhases({}))
  for (const child of children) attachRenderChild(parent, child)
  const completion = new Promise<boolean>((resolve) => {
    Effect.runCallback(parent.runRenderCycleEffect(), {
      onExit: (exit) => resolve(Exit.isSuccess(exit)),
    })
  })
  // Restoring the caller's scheduler context may yield after the transaction.
  // The legacy synchronous work, state transitions and events must finish first.
  const committedAtReturn = [parent, ...children].every(
    (owner) =>
      owner.getCurrentRenderPhase() === orderedRenderPhases.at(-1)! &&
      Object.values(owner.renderPhaseStates).every(
        (state) => state.initialized,
      ),
  )
  const writesAtReturn = children.reduce(
    (count, child) => count + child.writes,
    parent.writes,
  )
  expect(await completion).toBe(true)
  expect(committedAtReturn).toBe(true)
  expect(writesAtReturn).toBe(25)
  for (const owner of [parent, ...children]) {
    expect(owner.getCurrentRenderPhase()).toBe(orderedRenderPhases.at(-1)!)
    expect(
      Object.values(owner.renderPhaseStates).every(
        (state) => state.initialized,
      ),
    ).toBe(true)
  }
  parent.runRenderCycle()
  expect(
    children.reduce((count, child) => count + child.writes, parent.writes),
  ).toBe(25)
})
