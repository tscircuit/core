import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("public F1C100S swapped alternate functions produce one warning per chip and share fetched facts", async () => {
  // Public board: seveibar/f1c100s-linux-dev-board, modules/f1c100s/imports/F1C100S.tsx.
  // Reference: Allwinner F1C100s Datasheet Rev 1.0, section 4.2:
  // PE1 = TWI2_SDA, PE0 = TWI2_SCK, TPY2 = UART1_TX/SPI1_MISO,
  // TPY1 = UART1_RX/SPI1_CLK. These facts also appear in registry metadata.
  const { importedCircuitJson, importedPorts } = getChipPinMetadataFixture([
    { supports_i2c_sda: true, supports_uart_tx: true },
    { supports_i2c_scl: true, supports_uart_rx: true },
    { supports_uart_tx: true, supports_spi_miso: true },
    { supports_uart_rx: true, supports_spi_sck: true },
  ])
  const pinLabels = {
    pin48: "PE1",
    pin49: "PE0",
    pin63: "TPY2",
    pin64: "TPY1",
  }
  Object.entries(pinLabels).forEach(([pin, name], index) => {
    Object.assign(importedPorts[index]!, {
      name,
      pin_number: Number(pin.slice(3)),
      port_hints: [pin, name],
    })
  })
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
    <group name="processors" subcircuit partsEngine={partsEngine}>
      {["U1", "U2"].map((name) => (
        <chip
          key={name}
          name={name}
          manufacturerPartNumber="F1C100S"
          pinLabels={pinLabels}
          pinAttributes={{
            pin48: { capabilities: ["i2c_scl", "uart_tx"] },
            pin49: { capabilities: ["i2c_sda", "uart_rx"] },
            pin63: { capabilities: ["uart_rx", "spi_sck"] },
            pin64: { capabilities: ["uart_tx", "spi_miso"] },
          }}
        />
      ))}
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(fetchCalls).toBe(1)
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(2)
  for (const warning of warnings) {
    expect(warning.message).toContain("fetched pin metadata on 4 pins")
    expect(warning.message).toContain("PE1 (capabilities:")
    expect(warning.message).toContain("fetched supports_i2c_sda: true")
    expect(warning.message).toContain("PE0 (capabilities:")
    expect(warning.message).toContain("fetched supports_i2c_scl: true")
    expect(warning.message).toContain("TPY2 (capabilities:")
    expect(warning.message).toContain("fetched supports_spi_miso: true")
    expect(warning.message).toContain("and 1 more")
    expect(warning.message).not.toContain("TPY1 (")
    expect(warning.source_port_ids).toHaveLength(4)
    expect(
      warning.source_port_ids.map(
        (portId) => circuit.db.source_port.get(portId)!.pin_number,
      ),
    ).toEqual([48, 49, 63, 64])
  }
  expect(warnings[0]!.source_component_id).not.toBe(
    warnings[1]!.source_component_id,
  )
})
