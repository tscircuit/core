import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Cause from "effect/Cause"
import * as Result from "effect/Result"
import { RootCircuit } from "lib/RootCircuit"
import {
  RenderSettlementError,
  renderUntilSettledEffect,
} from "lib/utils/render/render-until-settled"

test("the internal Effect keeps a typed settlement error with the original cause", async () => {
  const circuit = new RootCircuit()
  const failure = new Error("render failed")
  circuit.render = () => {
    throw failure
  }
  const program: Effect.Effect<void, RenderSettlementError> =
    renderUntilSettledEffect({
      circuit,
      prepareRender: () => {},
      hasUnrenderedUpdates: () => false,
      shouldRenderAfterWait: () => true,
    })
  const exit = await Effect.runPromiseExit(program)
  expect(Exit.isFailure(exit)).toBe(true)
  if (Exit.isFailure(exit)) {
    const error = Cause.findError(exit.cause)
    expect(Result.isSuccess(error)).toBe(true)
    if (Result.isSuccess(error)) {
      expect(error.success).toBeInstanceOf(RenderSettlementError)
      expect(error.success.cause).toBe(failure)
    }
  }
})
