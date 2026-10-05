import { expect, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import type { Port } from "lib/components/primitive-components/Port"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rerenders update a single mismatch warning and correcting declarations removes it", async () => {
  const { partsEngine } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
  ])
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresVoltage: "1.8V" },
          GND: { requiresVoltage: "1.8V" },
        }}
      />
      <chip
        name="U2"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pcbX={3}
        pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const chip = circuit.selectOne(".U1") as Chip<string>
  const originalWarning =
    circuit.db.source_component_pins_underspecified_warning.getWhere({
      source_component_id: chip.source_component_id!,
    })!
  expect(originalWarning.source_port_ids).toHaveLength(2)
  chip.setProps({
    ...chip.props,
    pinAttributes: {
      VDD: { requiresVoltage: "3.3V" },
      GND: { requiresVoltage: "1.8V" },
    },
  })
  for (const port of chip.selectAll<Port>("port")) port.updateSourceRender()
  chip.updateSourceDesignRuleChecks()
  const updatedWarning =
    circuit.db.source_component_pins_underspecified_warning.getWhere({
      source_component_id: chip.source_component_id!,
    })!
  expect(updatedWarning.source_component_pins_underspecified_warning_id).toBe(
    originalWarning.source_component_pins_underspecified_warning_id,
  )
  expect(updatedWarning.source_port_ids).toHaveLength(1)
  expect(updatedWarning.message).toContain("on 1 pin:")
  chip.setProps({
    ...chip.props,
    pinAttributes: {
      VDD: { requiresVoltage: "3.3V" },
      GND: { requiresVoltage: 0 },
    },
  })
  for (const port of chip.selectAll<Port>("port")) port.updateSourceRender()
  chip.updateSourceDesignRuleChecks()
  expect(
    circuit.db.source_component_pins_underspecified_warning.getWhere({
      source_component_id: chip.source_component_id!,
    }),
  ).toBeNull()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(1)
  expect(
    circuit.db.source_component_pins_underspecified_warning.list()[0]!.message,
  ).toContain("Chip U2")
})
