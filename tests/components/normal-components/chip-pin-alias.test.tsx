import { expect, it } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("Chip with pin labels as strings and duplicates", async () => {
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
            pins: ["B1", "B2"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["B3", "B3"],
          },
        }}
        supplierPartNumbers={{
          lcsc: ["C165948"],
        }}
      />
    </board>,
  )

  circuit.render()

  const fs = require("fs")
  fs.writeFileSync("circuit.json", JSON.stringify(circuit.getCircuitJson(), null, 2))
  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})

it.skip("Chip with pin labels as numbers, decimals and duplicates", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schPinSpacing={0.75}
        schPortArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: [1, 2],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: [3, -4],
          },
          topSide: {
            direction: "left-to-right",
            pins: [2, 6.5],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: [7, 7],
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

it.skip("Chip with pin labels as duplicates", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schPinSpacing={0.75}
        schPortArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin3", "pin3", "pin3"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["pin4", "pin2", "pin3"],
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
