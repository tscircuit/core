import { expect, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chips fetch and compare only their own pins without a board or importing an official footprint", async () => {
  const { partsEngine } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
  ])
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group name="chips" subcircuit partsEngine={partsEngine}>
      <chip
        name="U1"
        manufacturerPartNumber="TEST_CHIP"
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: true, requiresVoltage: "1.8V" },
          GND: { requiresGround: true },
        }}
      />
      <chip
        name="U2"
        manufacturerPartNumber="TEST_CHIP"
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: true, requiresVoltage: "3300mV" },
          GND: { requiresGround: true },
        }}
      />
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.selectAll("board")).toHaveLength(0)
  const incorrectChip = circuit.selectOne(".U1") as Chip<string>
  const validChip = circuit.selectOne(".U2") as Chip<string>
  expect(incorrectChip._importedSourcePorts).toHaveLength(0)
  expect(validChip._importedSourcePorts).toHaveLength(0)
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.source_component_id).toBe(
    incorrectChip.source_component_id!,
  )
  expect(warnings[0]!.message).toContain(
    'VDD (requiresVoltage: "1.8V", fetched requires_voltage: 3.3)',
  )
  for (const sourcePortId of warnings[0]!.source_port_ids) {
    expect(circuit.db.source_port.get(sourcePortId)?.source_component_id).toBe(
      incorrectChip.source_component_id!,
    )
  }
  incorrectChip.updateSourceDesignRuleChecks()
  validChip.updateSourceDesignRuleChecks()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toEqual(warnings)
})
