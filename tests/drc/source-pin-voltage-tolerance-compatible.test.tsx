import { expect, test } from "bun:test"
import { runAllNetlistChecks } from "@tscircuit/checks"
import { addF1cVoltageCircuit } from "tests/fixtures/f1c-voltage-compatibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core accepts inclusive voltage tolerance bounds through named and numbered pin aliases", async () => {
  for (const outputVoltage of ["2.66V", "2.94V"]) {
    for (const tolerance of [0.05, "5%"] as const) {
      for (const alias of ["AVCC", "pin80"]) {
        const { circuit } = getTestFixture()
        addF1cVoltageCircuit(circuit, outputVoltage, tolerance, alias)
        await circuit.renderUntilSettled()
        expect(circuit.db.source_component_misconfigured_error.list()).toEqual(
          [],
        )
        expect(circuit.db.source_runtime_error.list()).toEqual([])
        expect(
          await runAllNetlistChecks(
            JSON.parse(JSON.stringify(circuit.getCircuitJson())),
          ),
        ).toEqual([])
        expect(
          circuit.db.source_port.list().find((port) => port.name === "AVCC")!
            .requires_voltage,
        ).toBe(2.8)
        expect(
          circuit.db.source_port.list().find((port) => port.name === "AVCC")!
            .required_voltage_tolerance,
        ).toBe(0.05)
        if (
          outputVoltage === "2.94V" &&
          tolerance === "5%" &&
          alias === "AVCC"
        ) {
          expect(circuit).toMatchSchematicSnapshot(import.meta.path)
        }
      }
    }
  }
})
