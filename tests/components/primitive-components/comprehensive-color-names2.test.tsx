import { expect, test } from "bun:test"
import { Circuit } from "../../../index"

test("schematicbox with titleColor should support color names", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematicbox
        schX={0}
        schY={0}
        width={3}
        height={2}
        title="Test Box"
        titleColor="purple"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicTexts = circuitJson.filter(
    (item: any) => item.type === "schematic_text",
  ) as any[]

  // The title should be rendered as a schematic_text with purple color
  expect((schematicTexts[0] as any).text).toBe("Test Box")
  expect((schematicTexts[0] as any).color).toBe("#800080") // purple
})

