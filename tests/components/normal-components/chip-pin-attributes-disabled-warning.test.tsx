import { expect, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("comparison warnings respect platform DRC controls and leave connectors alone", async () => {
  const platforms: PlatformConfig[] = [
    { drcChecksDisabled: true },
    { pinSpecificationDrcChecksDisabled: true },
  ]
  for (const platform of platforms) {
    const { partsEngine } = getChipPinMetadataFixture([
      { requires_power: true, requires_voltage: 3.3 },
      { requires_ground: true, requires_voltage: 0 },
    ])
    const { circuit } = getTestFixture({ platform })
    circuit.add(
      <board partsEngine={partsEngine} routingDisabled>
        <chip
          name="U1"
          footprint="jlcpcb:C_TEST"
          supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
          pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.source_component_pins_underspecified_warning.list(),
    ).toHaveLength(0)
    expect(circuit.db.source_no_power_pin_defined_warning.list()).toHaveLength(
      0,
    )
    expect(circuit.db.source_no_ground_pin_defined_warning.list()).toHaveLength(
      0,
    )
  }
  const { partsEngine } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
  ])
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <resistor name="R1" footprint="0402" resistance="1k" />
      <connector
        name="J1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(0)
})
