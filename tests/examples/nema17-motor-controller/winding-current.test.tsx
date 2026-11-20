import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSchematicDiagnostics } from "./get-schematic-diagnostics"
import Rp2040MotorControllerCurrentSense from "./winding-current.circuit"

test("RP2040 motor controller winding current schematic", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<Rp2040MotorControllerCurrentSense />)

  await circuit.renderUntilSettled()

  expect(getSchematicDiagnostics(circuit.getCircuitJson())).toMatchSnapshot(
    "diagnostics",
  )
  expect(circuit.db.schematic_element_outside_sheet_warning.list()).toEqual([])
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path, {
    width: 1200,
  })
})
