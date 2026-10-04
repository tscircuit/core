import { expect, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chips without attributes warn once and updates remove resolved warnings", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="pinrow2" />
      <chip name="U2" footprint="pinrow2" pcbX={3} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(2)
  expect(circuit.db.source_no_power_pin_defined_warning.list()).toHaveLength(2)
  expect(circuit.db.source_no_ground_pin_defined_warning.list()).toHaveLength(2)
  for (const warning of warnings) {
    expect(warning.source_port_ids).toHaveLength(2)
    expect(warning.message).toContain(
      "missing electrical role in pinAttributes",
    )
  }
  const chip = circuit.selectOne(".U1") as Chip<string>
  const sourcePorts = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === chip.source_component_id)
  circuit.db.source_port.update(sourcePorts[0]!.source_port_id, {
    is_input: true,
  })
  chip.updateSourceDesignRuleChecks()
  const updatedWarning =
    circuit.db.source_component_pins_underspecified_warning.getWhere({
      source_component_id: chip.source_component_id!,
    })!
  expect(updatedWarning.source_port_ids).toEqual([
    sourcePorts[1]!.source_port_id,
  ])
  expect(updatedWarning.message).toContain("affecting 1 pin:")
  circuit.db.source_port.update(sourcePorts[1]!.source_port_id, {
    do_not_connect: true,
  })
  chip.updateSourceDesignRuleChecks()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(1)
  expect(
    circuit.db.source_component_pins_underspecified_warning.getWhere({
      source_component_id: chip.source_component_id!,
    }),
  ).toBeNull()
  expect(circuit.db.source_no_power_pin_defined_warning.list()).toHaveLength(1)
  expect(circuit.db.source_no_ground_pin_defined_warning.list()).toHaveLength(1)
})
