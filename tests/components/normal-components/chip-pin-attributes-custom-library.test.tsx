import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import externalFootprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom supplier-library footprints still fetch comparison facts if the library has no pin metadata", async () => {
  const { partsEngine } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
  ])
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({
          footprintCircuitJson: externalFootprint as AnyCircuitElement[],
        }),
      },
    },
  })
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{ VDD: { requiresVoltage: "1.8V" } }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toContain(
    'VDD (requiresVoltage: "1.8V", fetched requires_voltage: 3.3)',
  )
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
})
