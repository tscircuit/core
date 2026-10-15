import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit pin labels exclude extra imported-switch terminals without hiding genuine missing traces", async () => {
  const symbolCircuitJson: AnyCircuitElement[] = [
    {
      type: "schematic_symbol",
      schematic_symbol_id: "custom_symbol",
      name: "custom_switch_symbol",
    },
    {
      type: "schematic_component",
      schematic_component_id: "custom_switch",
      schematic_symbol_id: "custom_symbol",
      source_component_id: "custom_source",
      center: { x: 0, y: 0 },
      size: { width: 2, height: 0.5 },
      is_box_with_pins: true,
    },
    {
      type: "schematic_rect",
      schematic_rect_id: "custom_body",
      schematic_component_id: "custom_switch",
      center: { x: 0, y: 0 },
      width: 1.2,
      height: 0.5,
      rotation: 0,
      stroke_width: 0.03,
      color: "#880000",
      is_filled: false,
      is_dashed: false,
    },
    ...([3, 7] as const).flatMap((pinNumber, index): AnyCircuitElement[] => [
      {
        type: "source_port",
        source_port_id: `custom_source_port_${pinNumber}`,
        source_component_id: "custom_source",
        pin_number: pinNumber,
        name: `pin${pinNumber}`,
        port_hints: [`pin${pinNumber}`],
      },
      {
        type: "schematic_port",
        schematic_port_id: `custom_schematic_port_${pinNumber}`,
        schematic_component_id: "custom_switch",
        source_port_id: `custom_source_port_${pinNumber}`,
        center: { x: index === 0 ? -1 : 1, y: 0 },
        facing_direction: index === 0 ? "right" : "left",
        side_of_component: index === 0 ? "left" : "right",
        distance_from_component_edge: 0.4,
        pin_number: pinNumber,
      },
      {
        type: "schematic_text",
        schematic_text_id: `custom_pin_label_${pinNumber}`,
        schematic_component_id: "custom_switch",
        text: `pin${pinNumber}`,
        anchor: "center",
        position: { x: index === 0 ? -1 : 1, y: 0.4 },
        font_size: 0.18,
        rotation: 0,
        color: "#000000",
      },
    ]),
  ]
  const originalSymbol = structuredClone(symbolCircuitJson)
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <switch
        name="SW1"
        type="spst"
        schY={1}
        symbol={symbolCircuitJson}
        pinLabels={{ pin3: "pin3", pin7: "pin7" }}
        noConnect={["pin3"]}
      />
      <schematictext
        text="SW1: imported terminal diagram has only pins 3 and 7"
        schY={2.1}
        fontSize={0.2}
      />
      <schematictext
        text="Pin3 marked NC; pin7 left open on purpose"
        schY={0.25}
        fontSize={0.2}
      />
      <switch name="SW2" type="spst" schY={-1} noConnect={["pin1", "pin2"]} />
      <schematictext
        text="SW2: built-in symbol keeps pins 1 and 2 (both NC)"
        schY={-1.8}
        fontSize={0.2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  for (const [name, expectedPins] of [
    ["SW1", [3, 7]],
    ["SW2", [1, 2]],
  ] as const) {
    const component = circuit.db.source_component
      .list()
      .find((c) => c.name === name)!
    const pins = circuit.db.source_port
      .list()
      .filter(
        (port) => port.source_component_id === component.source_component_id,
      )
      .map((port) => port.pin_number)
      .sort((a, b) => a! - b!)
    expect(pins).toEqual([...expectedPins])
  }
  expect(symbolCircuitJson).toEqual(originalSymbol)
  const warnings = circuit.db.source_pin_missing_trace_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toBe("Port pin7 on SW1 is missing a trace")

  const board = circuit.firstChild as Board
  board.add(
    <schematictext
      text={`Only warning: ${warnings[0]!.message}`}
      schY={-2.6}
      fontSize={0.2}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1000,
    height: 700,
  })
})
