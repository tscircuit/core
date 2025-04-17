import { test, expect } from "bun:test"
import { PrimitiveComponent, RootCircuit } from "lib"
import { selectOne } from "css-select"
import { primitiveComponentAdapter } from "./SubcircuitSelectorIndex"
import { grid } from "node_modules/@tscircuit/math-utils/dist/grid"

test("selector-index2", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <group>
        <resistor name="R1" resistance="10k" footprint="0402" />
        {grid({ rows: 4, cols: 4, xSpacing: 10, ySpacing: 10 }).map(
          ({ center, index }) => {
            return <led key={index} name={`LED${index}`} footprint="0402" />
          },
        )}
        <resistor name="R2" resistance="10k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  expect(
    selectOne("board .LED4 .pos", circuit as any, {
      adapter: primitiveComponentAdapter,
    }).toString(),
  ).toMatchInlineSnapshot(`"[object <port#80(pin:1 .LED4>.pin1) />]"`)
})
