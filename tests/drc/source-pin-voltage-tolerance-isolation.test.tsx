import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core applies tolerances per consumer and preserves explicit zero alias overrides", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <chip
        name="U_TOLERANT"
        schX={3}
        schY={3}
        pinLabels={{ pin1: "VCC" }}
        pinAttributes={{
          VCC: { requiresVoltage: "2.8V", requiredVoltageTolerance: "5%" },
        }}
        connections={{ VCC: "net.VCC" }}
      />
      <chip
        name="U_EXACT"
        schX={3}
        schY={1}
        pinLabels={{ pin1: "VCC" }}
        pinAttributes={{ VCC: { requiresVoltage: "2.8V" } }}
        connections={{ VCC: "net.VCC" }}
      />
      <chip
        name="U_ZERO"
        schX={3}
        schY={-1}
        pinLabels={{ pin1: "VCC" }}
        pinAttributes={{
          VCC: { requiresVoltage: "2.8V", requiredVoltageTolerance: "5%" },
          pin1: { requiredVoltageTolerance: 0 },
        }}
        connections={{ VCC: "net.VCC" }}
      />
      <chip
        name="U_REG"
        schX={-3}
        pinLabels={{ pin1: "VOUT" }}
        pinAttributes={{ VOUT: { providesVoltage: "2.9V" } }}
        connections={{ VOUT: "net.VCC" }}
      />
      <schematictext
        text="2.9 V supply: ±5% consumer passes; exact and zero tolerance consumers fail"
        schY={-4}
        fontSize={0.2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.source_component_misconfigured_error.list()
  expect(errors).toHaveLength(2)
  expect(errors.map((error) => error.message)).toEqual([
    "U_EXACT.VCC requires 2.8 V, but is connected to U_REG.VOUT, which provides 2.9 V.",
    "U_ZERO.VCC requires 2.8 V, but is connected to U_REG.VOUT, which provides 2.9 V.",
  ])
  expect(circuit.db.source_runtime_error.list()).toEqual([])
  const sourceComponents = circuit.db.source_component.list()
  for (const [name, tolerance] of [
    ["U_TOLERANT", 0.05],
    ["U_EXACT", undefined],
    ["U_ZERO", 0],
  ] as const) {
    const sourceComponent = sourceComponents.find(
      (component) => component.name === name,
    )!
    expect(
      circuit.db.source_port
        .list()
        .find(
          (port) =>
            port.source_component_id === sourceComponent.source_component_id,
        )!.required_voltage_tolerance,
    ).toBe(tolerance)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
  })
})
