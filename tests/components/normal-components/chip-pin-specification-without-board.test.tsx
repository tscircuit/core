import { expect, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("each chip checks only its own pins without a board or PCB/schematic rendering", async () => {
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group name="chips" subcircuit>
      <chip
        name="U1"
        pinLabels={{ pin1: "EMPTY", pin2: "DATA" }}
        pinAttributes={{ DATA: { isInput: true } }}
      />
      <chip
        name="U2"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        pinAttributes={{
          VCC: { requiresPower: true },
          GND: { requiresGround: true },
        }}
      />
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.selectAll("board")).toHaveLength(0)
  const incompleteChip = circuit.selectOne(".U1") as Chip<string>
  const validChip = circuit.selectOne(".U2") as Chip<string>
  const warnings = [
    ...circuit.db.source_component_pins_underspecified_warning.list(),
    ...circuit.db.source_no_power_pin_defined_warning.list(),
    ...circuit.db.source_no_ground_pin_defined_warning.list(),
  ]
  expect(warnings).toHaveLength(3)
  expect(warnings.map((warning) => warning.source_component_id)).toEqual([
    incompleteChip.source_component_id!,
    incompleteChip.source_component_id!,
    incompleteChip.source_component_id!,
  ])
  expect(warnings[0]!.message).toContain("EMPTY (missing electrical role")
  for (const warning of warnings) {
    for (const sourcePortId of warning.source_port_ids) {
      expect(
        circuit.db.source_port.get(sourcePortId)?.source_component_id,
      ).toBe(incompleteChip.source_component_id!)
    }
  }
  incompleteChip.updateSourceDesignRuleChecks()
  validChip.updateSourceDesignRuleChecks()
  expect([
    ...circuit.db.source_component_pins_underspecified_warning.list(),
    ...circuit.db.source_no_power_pin_defined_warning.list(),
    ...circuit.db.source_no_ground_pin_defined_warning.list(),
  ]).toEqual(warnings)
})
