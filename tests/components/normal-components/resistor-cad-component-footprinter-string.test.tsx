import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CadComponent } from "circuit-json"

test("resistor cad_component includes footprinter_string for 0402 footprint when cadModel is provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        cadModel={{ wrlUrl: "https://example.com/model.wrl" }}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cadComponent = circuit
    .getCircuitJson()
    .find((el): el is CadComponent => el.type === "cad_component")

  expect(cadComponent).toBeDefined()
  expect(cadComponent?.footprinter_string).toBe("0402")
})
