import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { RenderLedger, attachRenderChild } from "./render-helpers"

test("Effect child traversal visits a sibling appended during a phase and defers newly nested descendants", () => {
  const ledger: string[] = []
  const parent = new RenderLedger({ name: "parent", ledger })
  const first = new RenderLedger({ name: "first", ledger })
  const appended = new RenderLedger({ name: "appended", ledger })
  const nested = new RenderLedger({ name: "nested", ledger })
  attachRenderChild(parent, first)
  Object.defineProperty(first, "doInitialSourceRender", {
    value: () => {
      ledger.push("doInitial:SourceRender:first")
      attachRenderChild(parent, appended)
      attachRenderChild(first, nested)
    },
  })
  const program = parent.runRenderPhaseForChildrenEffect("SourceRender")
  expect(ledger).toEqual([])
  Effect.runSync(program)
  expect(ledger.filter((entry) => entry.startsWith("doInitial:"))).toEqual([
    "doInitial:SourceRender:first",
    "doInitial:SourceRender:appended",
  ])
  expect(nested.renderPhaseStates.SourceRender.initialized).toBe(false)
  parent.runRenderPhaseForChildren("CheckRefDesConvention")
  expect(
    ledger.filter((entry) =>
      entry.startsWith("doInitial:CheckRefDesConvention"),
    ),
  ).toEqual([
    "doInitial:CheckRefDesConvention:nested",
    "doInitial:CheckRefDesConvention:first",
    "doInitial:CheckRefDesConvention:appended",
  ])
})
