import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { renderUntilSettledEffect } from "lib/utils/render/render-until-settled"
import * as Effect from "effect/Effect"

test("completion before subscription wakes the Effect waiter without a timeout", async () => {
  const circuit = new RootCircuit()
  let renderCalls = 0
  let pendingUpdate = false
  circuit.render = () => {
    renderCalls++
  }
  circuit.isDoneRendering = () => renderCalls === 2
  const on = circuit.on.bind(circuit)
  circuit.on = (event, listener) => {
    pendingUpdate = true
    on(event, listener)
  }
  await Effect.runPromise(
    renderUntilSettledEffect({
      circuit,
      prepareRender: () => {},
      hasUnrenderedUpdates: () => pendingUpdate,
      shouldRenderAfterWait: () => pendingUpdate,
    }),
  )
  expect(renderCalls).toBe(2)
  expect(circuit.hasEventListener("asyncEffect:end")).toBe(false)
})
