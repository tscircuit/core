import { expect, test } from "bun:test"
import { Circuit } from "index"
import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import type { SchematicText } from "circuit-json"

test("SCHEMATIC_COMPONENT_OUTLINE_COLOR is portable rgb color format", () => {
  expect(SCHEMATIC_COMPONENT_OUTLINE_COLOR).toBe("rgb(132, 0, 0)")
})

test("resolves {REFDES} placeholder in schematictext to component name", async () => {
  const Sym = () => (
    <symbol width={4} height={2}>
      <schematicpath
        strokeWidth={0.05}
        points={[
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ]}
      />
      <schematictext text="{REFDES}" schX={0} schY={0.6} />
      <port name="1" pinNumber={1} direction="right" schX={1} schY={0} />
    </symbol>
  )

  const circuit = new Circuit()
  circuit.add(
    <board width="20mm" height="10mm">
      <chip name="MP1" footprint="0402" pcbX={-6} schX={-6} symbol={<Sym />} />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const schematicText = circuitJson.find(
    (el): el is SchematicText =>
      el.type === "schematic_text" && el.text === "MP1",
  )

  expect(schematicText).toBeDefined()
  expect(schematicText?.text).toBe("MP1")
})
