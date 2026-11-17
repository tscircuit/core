import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Rp2040MotorControllerCurrentSense from "./example43-rp2040-motor-controller.circuit"

test("example43: RP2040 motor controller winding current schematic", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<Rp2040MotorControllerCurrentSense />)

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_element_outside_sheet_warning.list()).toEqual([])
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path, {
    width: 1200,
  })
})
