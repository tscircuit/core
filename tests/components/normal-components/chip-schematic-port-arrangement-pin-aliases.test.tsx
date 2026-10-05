import { expect, test } from "bun:test"
import type { SchematicPortArrangement } from "@tscircuit/props"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic arrangement exports physical pin numbers while preserving aliases and positions", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  const pinLabels = {
    pin1: "VCC",
    pin2: "SCL",
    pin3: ["DIO8", "SDA"],
    pin4: ["TX", "TX_ALIAS"],
    pin5: "RX",
    pin6: "ENABLE",
    pin7: "GND",
    pin8: "RESET",
  }
  const schPinArrangement = {
    leftSide: {
      pins: ["DIO8", "TX_ALIAS"],
      direction: "bottom-to-top",
    },
    rightSide: { pins: [6, "pin5"], direction: "top-to-bottom" },
    topSide: { pins: ["VCC", "2"], direction: "right-to-left" },
    bottomSide: { pins: ["GND", "RESET"], direction: "left-to-right" },
  } satisfies SchematicPortArrangement
  const originalSchPinArrangement = structuredClone(schPinArrangement)
  circuit.add(
    <board>
      <chip
        name="U1"
        pinLabels={pinLabels}
        schPinArrangement={schPinArrangement}
        schX={-4}
        schWidth={3}
        schHeight={2}
      />
      <chip
        name="U2"
        pinLabels={pinLabels}
        schPinArrangement={{
          leftSide: { pins: [3, 4], direction: "bottom-to-top" },
          rightSide: { pins: [6, 5], direction: "top-to-bottom" },
          topSide: { pins: [1, 2], direction: "right-to-left" },
          bottomSide: { pins: [7, 8], direction: "left-to-right" },
        }}
        schX={4}
        schWidth={3}
        schHeight={2}
      />
    </board>,
  )
  circuit.render()

  const [labelledChip, numberedChip] = circuit.db.schematic_component.list()
  expect(labelledChip.port_arrangement).toEqual(numberedChip.port_arrangement)
  expect(labelledChip.port_arrangement).toMatchObject({
    left_side: { pins: [3, 4], direction: "bottom-to-top" },
    right_side: { pins: [6, 5], direction: "top-to-bottom" },
    top_side: { pins: [1, 2], direction: "right-to-left" },
    bottom_side: { pins: [7, 8], direction: "left-to-right" },
  })
  expect(labelledChip.port_labels?.pin3).toBe("DIO8")
  expect(schPinArrangement).toEqual(originalSchPinArrangement)

  const labelledPorts = circuit.db.schematic_port.list({
    schematic_component_id: labelledChip.schematic_component_id,
  })
  const numberedPorts = circuit.db.schematic_port.list({
    schematic_component_id: numberedChip.schematic_component_id,
  })
  for (const labelledPort of labelledPorts) {
    const numberedPort = numberedPorts.find(
      (port) => port.pin_number === labelledPort.pin_number,
    )!
    expect(labelledPort.display_pin_label).toBe(numberedPort.display_pin_label)
    expect(labelledPort.side_of_component).toBe(numberedPort.side_of_component)
    expect(labelledPort.center.x - labelledChip.center.x).toBeCloseTo(
      numberedPort.center.x - numberedChip.center.x,
    )
    expect(labelledPort.center.y - labelledChip.center.y).toBeCloseTo(
      numberedPort.center.y - numberedChip.center.y,
    )
  }
  const dio8SourcePort = circuit.db.source_port.getWhere({
    source_component_id: labelledChip.source_component_id,
    pin_number: 3,
  })!
  expect(dio8SourcePort.port_hints).toContain("DIO8")
  expect(dio8SourcePort.port_hints).toContain("SDA")
  for (const circuitElement of circuit.getCircuitJson()) {
    any_circuit_element.parse(circuitElement)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
