import { expect, it } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("Chip with pins in string", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schPinSpacing={0.75}
        schPortArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["B1", "B2"],
        },
      }}
      supplierPartNumbers={{
        lcsc: ["C165948"],
      }}
    /> 
    </board>,
  )

  circuit.render()
  
  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
