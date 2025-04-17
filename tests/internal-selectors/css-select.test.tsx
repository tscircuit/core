import { selectOne } from "css-select"
import { test, expect } from "bun:test"
import { RootCircuit } from "lib"

test("css-select on RootCircuit", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const result = selectOne("board > .R1", circuit, {
    // adapter: ...
  })

  expect(result?.props.name).toBe("R1")
})
