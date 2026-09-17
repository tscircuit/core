import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"

test("repro3982: SCHEMATIC_COMPONENT_OUTLINE_COLOR is portable SVG rgb format and circuit elements emit rgb(132, 0, 0)", () => {
  expect(SCHEMATIC_COMPONENT_OUTLINE_COLOR).toBe("rgb(132, 0, 0)")
  expect(SCHEMATIC_COMPONENT_OUTLINE_COLOR).not.toContain("rgba")

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <schematicline x1={0} y1={0} x2={5} y2={5} />
      <schematicrect center={{ x: 2, y: 2 }} width={4} height={4} />
      <schematiccircle center={{ x: -2, y: -2 }} radius={2} />
      <resistor name="R1" resistance="1k" footprint="0402" schX={0} schY={0} />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson() as any[]

  // Verify that any element with color does not use invalid 3-argument rgba(...)
  for (const element of circuitJson) {
    if ("color" in element && typeof element.color === "string") {
      expect(element.color).not.toBe("rgba(132, 0, 0)")
      if (element.color.includes("132, 0, 0")) {
        expect(element.color).toBe("rgb(132, 0, 0)")
      }
    }
  }

  const schematicLines = circuitJson.filter((e) => e.type === "schematic_line")
  expect(schematicLines.length).toBeGreaterThan(0)
  expect(schematicLines.some((l) => l.color === "rgb(132, 0, 0)")).toBe(true)
})
