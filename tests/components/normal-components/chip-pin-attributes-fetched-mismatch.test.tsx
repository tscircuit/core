import { expect, test } from "bun:test"
import { source_component_pins_underspecified_warning } from "circuit-json"
import type { Chip } from "lib/components/normal-components/Chip"
import { Fragment } from "react"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit declarations conflicting with fetched metadata produce one warning and three pin examples", async () => {
  const { partsEngine, importedCircuitJson } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
    { is_input: true, is_output: false },
    { is_gpio: true, can_use_open_drain: false },
  ])
  const originalImported = structuredClone(importedCircuitJson)
  const pinAttributes = {
    VDD: { requiresVoltage: "1.8V" },
    GND: { requiresVoltage: "3.3V" },
    DATA: { isOutput: true },
    GPIO: { canUseOpenDrain: true },
  }
  const originalDeclared = structuredClone(pinAttributes)
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="pinrow4"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "DATA", pin4: "GPIO" }}
        pinAttributes={pinAttributes}
        schX={0}
        schY={0.4}
        schWidth={2.4}
        schHeight={1.6}
      />
      <schematictext
        text="Custom footprint: compare pinAttributes with FETCHED part metadata"
        schX={0}
        schY={5}
        anchor="center"
        fontSize={0.3}
      />
      {[
        {
          x: -3.8,
          lines: [
            "FETCHED source_port facts (before overrides)",
            "pin1 / VDD: requires_voltage: 3.3",
            "pin2 / GND: requires_voltage: 0",
            "pin3 / DATA: is_output: false",
            "pin4 / GPIO: can_use_open_drain: false",
          ],
        },
        {
          x: 3.8,
          lines: [
            "USER declaration",
            "pinAttributes={{",
            'VDD: { requiresVoltage: "1.8V" },',
            'GND: { requiresVoltage: "3.3V" },',
            "DATA: { isOutput: true },",
            "GPIO: { canUseOpenDrain: true },",
            "}}",
          ],
        },
      ].flatMap(({ x, lines }) =>
        lines.map((text, line) => (
          <Fragment key={`${x}-${line}`}>
            <schematictext
              text={text}
              schX={x}
              schY={4.1 - line * 0.4}
              anchor="center"
              fontSize={0.22}
            />
          </Fragment>
        )),
      )}
      <schematictext
        text="All four pins conflict with fetched facts. One warning shows three examples + 'and 1 more'."
        schX={0}
        schY={-1.0}
        anchor="center"
        fontSize={0.22}
      />
      <schematictext
        text="User overrides remain in the output; the checker does not silently replace them."
        schX={0}
        schY={-1.4}
        anchor="center"
        fontSize={0.22}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  const warning = warnings[0]!
  expect(
    source_component_pins_underspecified_warning.safeParse(warning).success,
  ).toBe(true)
  expect(warning.message).toContain(
    "Chip U1 has pinAttributes that conflict with fetched pin metadata on 4 pins",
  )
  expect(warning.message).toContain(
    'VDD (requiresVoltage: "1.8V", fetched requires_voltage: 3.3)',
  )
  expect(warning.message).toContain(
    'GND (requiresVoltage: "3.3V", fetched requires_voltage: 0)',
  )
  expect(warning.message).toContain(
    "DATA (isOutput: true, fetched is_output: false)",
  )
  expect(warning.message).toContain("and 1 more")
  expect(warning.message).not.toContain("GPIO (")
  expect(warning.source_port_ids).toHaveLength(4)
  expect(warning.subcircuit_id).toBeDefined()
  expect(warning.message).not.toContain(warning.source_component_id)
  const supply = circuit.db.source_port
    .list()
    .find((port) => port.name === "VDD")!
  expect(supply.requires_voltage).toBe(1.8)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(4)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(importedCircuitJson).toEqual(originalImported)
  expect(pinAttributes).toEqual(originalDeclared)
  const chip = circuit.selectOne(".U1") as Chip<string>
  chip.updateSourceDesignRuleChecks()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toEqual(warnings)
  for (const [line, text] of [
    "Actual generated warning (1 record):",
    ...warning.message.match(/.{1,85}(?:\s|$)/g)!,
  ].entries()) {
    circuit.db.schematic_text.insert({
      text: text.trim(),
      position: { x: 0, y: -2.1 - line * 0.4 },
      anchor: "center",
      font_size: 0.22,
      rotation: 0,
      color: "#9a3412",
    })
  }
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1200,
    height: 850,
    css: ".sch-text { white-space: pre; }",
  })
})
