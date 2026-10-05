import { expect, test } from "bun:test"
import { addF1cVoltageCircuit } from "tests/fixtures/f1c-voltage-compatibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core reports voltages outside either tolerance bound and preserves zero tolerance", async () => {
  for (const [outputVoltage, tolerance] of [
    ["2.659V", "5%"],
    ["2.941V", "5%"],
    ["2.81V", 0],
    ["2.81V", undefined],
  ] as const) {
    const { circuit } = getTestFixture()
    addF1cVoltageCircuit(circuit, outputVoltage, tolerance)
    await circuit.renderUntilSettled()
    const errors = circuit.db.source_component_misconfigured_error.list()
    expect(errors).toHaveLength(1)
    expect(errors[0].source_port_ids).toEqual([
      circuit.db.source_port.list().find((port) => port.name === "AVCC")!
        .source_port_id,
      circuit.db.source_port.list().find((port) => port.name === "VOUT")!
        .source_port_id,
    ])
    expect(circuit.db.source_runtime_error.list()).toEqual([])
    await circuit.renderUntilSettled()
    expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(
      1,
    )
    if (outputVoltage === "2.941V") {
      expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
        showErrorsInTextOverlay: true,
      })
    }
  }
})
