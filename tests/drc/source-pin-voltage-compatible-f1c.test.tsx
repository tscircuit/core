import { expect, test } from "bun:test"
import { addF1cVoltageCircuit } from "tests/fixtures/f1c-voltage-compatibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core accepts the correct 2.8 V supply for F1C100S AVCC", async () => {
  const { circuit } = getTestFixture()
  addF1cVoltageCircuit(circuit, "2.8V")
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
  expect(
    circuit.db.source_port.list().find((port) => port.name === "VOUT")!
      .provides_voltage,
  ).toBe(2.8)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
