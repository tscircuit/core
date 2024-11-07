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
          pins: ["B2", "B1"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["A1", "A2"],
        },
        topSide: {
          direction: "left-to-right",
          pins: ["B10", "B11"],
        },
        bottomSide: {
          direction: "left-to-right",
          pins: [7, 8],
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
