import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("the settled Promise keeps its ordering relative to a caller's queued microtask", async () => {
  const circuit = new RootCircuit()
  circuit.render = () => {}
  circuit.isDoneRendering = () => true
  const ordering: string[] = []
  const settled = circuit.renderUntilSettled().then(() => {
    ordering.push("resolved")
  })
  queueMicrotask(() => {
    ordering.push("caller")
  })
  await settled
  expect(ordering).toEqual(["resolved", "caller"])
})
