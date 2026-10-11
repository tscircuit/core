import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supplier footprint imports and custom chip validation share the same part fetch", async () => {
  const { importedCircuitJson } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
  ])
  let fetchCalls = 0
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => {
      fetchCalls++
      return importedCircuitJson
    },
  }
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group subcircuit partsEngine={partsEngine}>
      <chip
        name="U1"
        manufacturerPartNumber="TEST_CHIP"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: true, requiresVoltage: "1.8V" },
          GND: { requiresGround: true },
        }}
      />
      <chip
        name="U2"
        manufacturerPartNumber="TEST_CHIP"
        footprint="pinrow2"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: true, requiresVoltage: "1.8V" },
          GND: { requiresGround: true },
        }}
      />
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(fetchCalls).toBe(1)
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(2)
  expect(
    warnings.every((warning) =>
      warning.message.includes(
        'requiresVoltage: "1.8V", fetched requires_voltage: 3.3',
      ),
    ),
  ).toBe(true)
})
