import { test, expect } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic outline color is a strict-SVG-safe rgb() color", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicline x1={0} y1={0} x2={10} y2={10} />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicLine = circuitJson.find((c) => c.type === "schematic_line")
  expect((schematicLine as any).color).toBe("rgb(132, 0, 0)")

  // Strict SVG consumers (e.g. CairoSVG) reject three-argument rgba()
  const svg = convertCircuitJsonToSchematicSvg(circuitJson)
  expect(svg).not.toContain("rgba(132")
  expect(svg).toContain("rgb(132, 0, 0)")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
