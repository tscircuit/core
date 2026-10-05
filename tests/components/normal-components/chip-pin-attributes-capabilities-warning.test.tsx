import { expect, test } from "bun:test"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("declared capabilities and active configurations are checked against fetched support flags", async () => {
  const { partsEngine } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
    {
      supports_i2c_sda: false,
      supports_uart_tx: true,
      can_use_open_drain: false,
    },
    { supports_i2c_sda: true },
  ])
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "DATA", pin4: "SDA" }}
        pinAttributes={{
          DATA: {
            capabilities: ["i2c_sda"],
            activeCapabilities: ["i2c_sda"],
            isUsingOpenDrain: true,
          },
          SDA: { capabilities: [] },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.source_port_ids).toHaveLength(2)
  expect(warnings[0]!.message).toContain(
    'capabilities: ["i2c_sda"], fetched supports_i2c_sda: false',
  )
  expect(warnings[0]!.message).toContain(
    'activeCapabilities: ["i2c_sda"], fetched supports_i2c_sda: false',
  )
  expect(warnings[0]!.message).toContain(
    "isUsingOpenDrain: true, fetched can_use_open_drain: false",
  )
  expect(warnings[0]!.message).toContain(
    "SDA (capabilities: [], fetched supports_i2c_sda: true)",
  )
})
