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
          pin4: "NC",
          pin5: ["A5", "MODES"],
          pin6: ["A6", "DISABLED_MODES"],
        }}
        pinAttributes={{
          VCC: { requiresPower: true, mustBeConnected: true },
          GND: { requiresGround: true },
          VOUT: {
            providesPower: true,
            providesVoltage: 3.3,
            capabilities: [
              "i2c_sda",
              "i2c_scl",
              "spi_cs",
              "spi_sck",
              "spi_mosi",
              "spi_miso",
              "uart_tx",
              "uart_rx",
            ],
            activeCapabilities: [
              "i2c_sda",
              "i2c_scl",
              "spi_cs",
              "spi_sck",
              "spi_mosi",
              "spi_miso",
              "uart_tx",
            ],
            activeCapability: "uart_rx",
          },
          pin5: {
            isInput: true,
            isOutput: true,
            isBidirectional: true,
            isPassive: true,
            canUseTriState: true,
            isUsingTriState: true,
            canUseOpenCollector: true,
            isUsingOpenCollector: true,
            canUseOpenEmitter: true,
            isUsingOpenEmitter: true,
            isGpio: true,
            highlightColor: "#ff0000",
          },
          A6: {
            isInput: false,
            isOutput: false,
            isBidirectional: false,
            isPassive: false,
            canUseTriState: false,
            isUsingTriState: false,
            canUseOpenCollector: false,
            isUsingOpenCollector: false,
            canUseOpenEmitter: false,
            isUsingOpenEmitter: false,
            isGpio: false,
            highlightColor: "",
            requiresVoltage: "-5V",
            recommendedDecouplingCapacitorCapacitance: "100nF",
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
  expect(getPort("VOUT")?.supports_i2c_scl).toBe(true)
  expect(getPort("VOUT")?.supports_spi_cs).toBe(true)
  expect(getPort("VOUT")?.supports_spi_sck).toBe(true)
  expect(getPort("VOUT")?.supports_spi_mosi).toBe(true)
  expect(getPort("VOUT")?.supports_spi_miso).toBe(true)
  expect(getPort("VOUT")?.supports_uart_tx).toBe(true)
  expect(getPort("VOUT")?.supports_uart_rx).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_i2c_sda).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_i2c_scl).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_spi_cs).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_spi_sck).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_spi_mosi).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_spi_miso).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_uart_tx).toBe(true)
  expect(getPort("VOUT")?.is_configured_for_uart_rx).toBe(true)
  expect(getPort("A5")).toMatchObject({
    is_input: true,
    is_output: true,
    is_bidirectional: true,
    is_passive: true,
    can_use_tri_state: true,
    is_using_tri_state: true,
    can_use_open_collector: true,
    is_using_open_collector: true,
    can_use_open_emitter: true,
    is_using_open_emitter: true,
    is_gpio: true,
    highlight_color: "#ff0000",
  })
  expect(getPort("A6")).toMatchObject({
    is_input: false,
    is_output: false,
    is_bidirectional: false,
    is_passive: false,
    can_use_tri_state: false,
    is_using_tri_state: false,
    can_use_open_collector: false,
    is_using_open_collector: false,
    can_use_open_emitter: false,
    is_using_open_emitter: false,
    is_gpio: false,
    highlight_color: "",
    requires_voltage: "-5V",
    recommended_decoupling_capacitor_capacitance: "100nF",
  })
  expect(getPort("NC")?.is_input).toBeUndefined()
  expect(getPort("NC")?.is_gpio).toBeUndefined()
  expect(getPort("NC")?.highlight_color).toBeUndefined()
})
