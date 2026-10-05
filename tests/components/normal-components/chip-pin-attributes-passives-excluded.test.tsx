import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistors capacitors and inductors never trigger chip pin validation fetches", async () => {
  const { importedCircuitJson } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true },
  ])
  const fetchedParts: (string | undefined)[] = []
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async ({ manufacturerPartNumber }) => {
      fetchedParts.push(manufacturerPartNumber)
      return importedCircuitJson
    },
  }
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group subcircuit partsEngine={partsEngine}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        manufacturerPartNumber="TEST_RESISTOR"
        supplierPartNumbers={{ jlcpcb: ["C_RESISTOR"] }}
        pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        manufacturerPartNumber="TEST_CAPACITOR"
        supplierPartNumbers={{ jlcpcb: ["C_CAPACITOR"] }}
        pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
      />
      <inductor
        name="L1"
        inductance="1mH"
        footprint="0402"
        manufacturerPartNumber="TEST_INDUCTOR"
        supplierPartNumbers={{ jlcpcb: ["C_INDUCTOR"] }}
        pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
      />
      <chip
        name="U1"
        manufacturerPartNumber="TEST_CHIP"
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: true, requiresVoltage: "1.8V" },
          GND: { requiresGround: true },
        }}
      />
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(fetchedParts).toEqual(["TEST_CHIP"])
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toContain("Chip U1 ")
  expect(
    circuit.db.source_component.get(warnings[0]!.source_component_id)!.name,
  ).toBe("U1")
  for (const sourcePortId of warnings[0]!.source_port_ids) {
    expect(circuit.db.source_port.get(sourcePortId)!.source_component_id).toBe(
      warnings[0]!.source_component_id,
    )
  }
})
