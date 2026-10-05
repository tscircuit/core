import { expect, test } from "bun:test"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("async fetched facts expose conflicting overrides while omissions inherit defaults", async () => {
  const { partsEngine, importedCircuitJson } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, provides_voltage: 0 },
  ])
  const originalCircuitJson = structuredClone(importedCircuitJson)
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
      />
      <chip
        name="U2"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pcbX={3}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: false },
          GND: { providesVoltage: "1.8V" },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toContain("Chip U2")
  expect(warnings[0]!.message).toContain(
    "VDD (requiresPower: false, fetched requires_power: true)",
  )
  expect(warnings[0]!.message).toContain(
    'GND (providesVoltage: "1.8V", fetched provides_voltage: 0)',
  )
  expect(warnings[0]!.source_port_ids).toHaveLength(2)
  expect(circuit.db.source_no_power_pin_defined_warning.list()).toHaveLength(0)
  expect(circuit.db.source_no_ground_pin_defined_warning.list()).toHaveLength(0)
  expect(importedCircuitJson).toEqual(originalCircuitJson)
})
