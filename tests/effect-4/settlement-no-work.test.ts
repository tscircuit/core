import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("a synchronous circuit emits renderComplete before returning its Promise", async () => {
  const circuit = new RootCircuit()
  const ordering: string[] = []
  circuit.render = () => {
    ordering.push("render")
  }
  circuit.isDoneRendering = () => true
  circuit.on("renderComplete", () => {
    ordering.push("complete")
  })
  const settled = circuit.renderUntilSettled()
  ordering.push("returned")
  expect(ordering).toEqual(["render", "complete", "returned"])
  await settled
  expect(circuit.db.source_project_metadata.list()).toHaveLength(1)
})
