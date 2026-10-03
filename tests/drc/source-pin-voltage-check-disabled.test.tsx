import { expect, test } from "bun:test"
import { addF1cVoltageCircuit } from "tests/fixtures/f1c-voltage-compatibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("the voltage compatibility check honors netlist DRC disable settings", async () => {
  const { circuit } = getTestFixture({
    platform: { netlistDrcChecksDisabled: true },
  })
  addF1cVoltageCircuit(circuit, "1.8V")
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
})
