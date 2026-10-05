import { expect, test } from "bun:test"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unknown fetched attributes and ambiguous imported pins cannot establish a mismatch", async () => {
  const { partsEngine, importedPorts, importedCircuitJson } =
    getChipPinMetadataFixture([{ is_input: false }, {}, { is_gpio: true }])
  importedCircuitJson.push({
    ...importedPorts[0]!,
    source_port_id: "duplicate_supply",
  })
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "DATA" }}
        pinAttributes={{
          VDD: { requiresPower: true, isInput: true },
          GND: { requiresGround: true, requiresVoltage: "0V" },
          DATA: { activeCapability: "uart_tx", isUsingOpenDrain: true },
        }}
      />
      <chip
        name="U2"
        footprint="pinrow2"
        pcbX={3}
        pinAttributes={{
          pin1: { requiresPower: true, requiresVoltage: "1.8V" },
          pin2: { requiresGround: true },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(0)
})
