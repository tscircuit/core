import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinAttributes are copied onto source_port records", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "VOUT",
          pin4: "SCK",
        }}
        pinAttributes={{
          VCC: { requiresPower: true, mustBeConnected: true },
          GND: { requiresGround: true },
          VOUT: {
            providesPower: true,
            providesVoltage: 3.3,
            capabilities: ["i2c_sda", "spi_mosi", "uart_tx"],
            activeCapabilities: ["i2c_sda", "uart_tx"],
          },
          SCK: {
            capabilities: ["spi_sck"],
            activeCapability: "spi_sck",
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const getPort = (name: string) =>
    sourcePorts.find((port) => port.name === name)

  expect(getPort("VCC")?.requires_power).toBe(true)
  expect(getPort("VCC")?.must_be_connected).toBe(true)
  expect(getPort("GND")?.requires_ground).toBe(true)
  expect(getPort("VOUT")?.provides_power).toBe(true)
  expect(getPort("VOUT")?.provides_voltage).toBe(3.3)
  expect(getPort("VOUT")?.supports_i2c_sda).toBe(true)
  expect(getPort("VOUT")?.supports_spi_mosi).toBe(true)
  expect(getPort("VOUT")?.supports_uart_tx).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_i2c_sda).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_uart_tx).toBe(true)
  expect(getPort("SCK")?.supports_spi_sck).toBe(true)
  expect(getPort("SCK")?.is_configured_for_spi_sck).toBe(true)
})
