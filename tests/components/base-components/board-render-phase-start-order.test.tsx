import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("board phase start events precede descendant phase rendering", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  const port = circuit.selectOne("port")
  expect(port).not.toBeNull()

  const schematicPortRenderEventOrder: string[] = []
  circuit.on("board:renderPhaseStarted", (event) => {
    if (event.phase === "SchematicPortRender") {
      schematicPortRenderEventOrder.push("board")
    }
  })
  circuit.on("renderable:renderLifecycle:anyEvent", (event) => {
    if (
      event.type === "renderable:renderLifecycle:SchematicPortRender:start" &&
      event.renderId === port!._renderId
    ) {
      schematicPortRenderEventOrder.push("port")
    }
  })

  circuit.render()

  expect(schematicPortRenderEventOrder).toEqual(["board", "port"])
})
