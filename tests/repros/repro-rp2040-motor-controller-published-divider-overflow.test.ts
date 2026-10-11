import { expect, test } from "bun:test"
import "tests/fixtures/extend-expect-circuit-snapshot"
import motorDriverCircuitJson from "./assets/rp2040-motor-controller-v1.0.42-motor-driver.circuit.json"

// Affected board: https://tscircuit.com/imrishabh18/rp2040-motor-controller#schematic
// Published version 1.0.42, motor_driver sheet. See the fixture provenance file.
test("published RP2040 motor_driver sheet shows reference text crossing its divider", async () => {
  const divider = motorDriverCircuitJson.find(
    (element) => element.type === "schematic_line" && element.is_dashed,
  )!
  const resistorSource = motorDriverCircuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "R_DRV_ENABLE_PU",
  )!
  const resistorSymbol = motorDriverCircuitJson.find(
    (element) =>
      element.type === "schematic_component" &&
      element.source_component_id === resistorSource.source_component_id,
  )!
  // The nominal box fits to the left, while the rendered name extends past
  // the divider. Preserve this real export as evidence of the reported bug.
  expect(resistorSymbol.center.x + resistorSymbol.size.width / 2).toBeLessThan(
    divider.x1,
  )
  expect(
    resistorSymbol.center.x + 0.16 + "R_DRV_ENABLE_PU".length * 0.12,
  ).toBeGreaterThan(divider.x1)

  // Fit the complete affected sheet's contents, omitting only the outer A4
  // paper frame so the section divider and reference labels are readable.
  const sheetContents = motorDriverCircuitJson.filter(
    (element) => element.type !== "schematic_sheet",
  )
  await expect(sheetContents).toMatchSchematicSnapshot(import.meta.path, {
    width: 1100,
    height: 1400,
  })
})
