import { expect, test } from "bun:test"
import { addF1cVoltageCircuit } from "tests/fixtures/f1c-voltage-compatibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core reports the F1C100S AVCC 1.8 V versus 2.8 V mismatch through its normal netlist DRC", async () => {
  const { circuit } = getTestFixture()
  addF1cVoltageCircuit(circuit, "1.8V")
  await circuit.renderUntilSettled()
  const errors = circuit.db.source_component_misconfigured_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    is_fatal: true,
    message:
      "U_F1C.AVCC requires 2.8 V, but is connected to U_REG.VOUT, which provides 1.8 V.",
  })
  expect(errors[0].source_port_ids).toEqual([
    circuit.db.source_port.list().find((port) => port.name === "AVCC")!
      .source_port_id,
    circuit.db.source_port.list().find((port) => port.name === "VOUT")!
      .source_port_id,
  ])
  expect(
    circuit.db.source_port.list().find((port) => port.name === "AVCC")!
      .requires_voltage,
  ).toBe(2.8)
  expect(
    circuit.db.source_port.list().find((port) => port.name === "VOUT")!
      .provides_voltage,
  ).toBe(1.8)
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(1)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
    grid: { cellSize: 1, labelCells: true },
  })
})
