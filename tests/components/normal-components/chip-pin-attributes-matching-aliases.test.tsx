import { expect, test } from "bun:test"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("physical numbers and aliases compare normalized voltages while valid runtime selections may differ from defaults", async () => {
  const { partsEngine } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, provides_voltage: 0 },
    {
      is_gpio: true,
      can_use_open_drain: true,
      is_using_open_drain: false,
      supports_i2c_sda: true,
      supports_uart_tx: true,
      is_configured_for_i2c_sda: false,
    },
    { is_input: false },
  ])
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{
          pin1: "VDD",
          pin2: "GND",
          pin3: ["BUS", "SDA"],
          pin4: "NC",
        }}
        pinAttributes={{
          "1": { requiresVoltage: "3300mV" },
          pin2: { providesVoltage: 0 },
          SDA: {
            isGpio: true,
            isUsingOpenDrain: true,
            capabilities: ["uart_tx", "i2c_sda"],
            activeCapability: "i2c_sda",
            highlightColor: "red",
            includeInBoardPinout: true,
          },
          NC: { isInput: false },
        }}
        noConnect={["NC"]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(0)
  expect(
    circuit.db.source_port.list().find((port) => port.pin_number === 3),
  ).toMatchObject({
    is_using_open_drain: true,
    is_configured_for_i2c_sda: true,
  })
})
