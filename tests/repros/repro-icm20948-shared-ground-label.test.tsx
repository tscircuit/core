import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import AirMouse from "./fixtures/air-mouse/index.circuit"

test("Air Mouse full schematic reproduces ICM-20948 shared GND routing", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(<AirMouse />)

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
