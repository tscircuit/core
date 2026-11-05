import { expect, test } from "bun:test"
import { schematic_component } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic arrangement emits numeric pins while preserving aliases and side order", () => {
  const { circuit } = getTestFixture()
  const arrangement = {
    leftSide: { pins: ["RETURN", "PWR"], direction: "bottom-to-top" as const },
    rightSide: ["3", "pin4"],
    topSide: ["CLK", 6],
    bottomSide: ["DATA", "8"],
  }
  const inputArrangement = structuredClone(arrangement)
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: ["VCC", "PWR"],
          pin2: ["GND", "RETURN"],
          pin3: "RX",
          pin4: "TX",
          pin5: "CLK",
          pin6: "ENABLE",
          pin7: "DATA",
          pin8: "RESET",
        }}
        schPortArrangement={arrangement}
      />
    </board>,
  )
  circuit.render()

  const emittedComponent = circuit.db.schematic_component.list()[0]
  expect(schematic_component.safeParse(emittedComponent).success).toBe(true)
  expect(emittedComponent.port_arrangement).toEqual({
    left_side: { pins: [2, 1], direction: "bottom-to-top" },
    right_side: { pins: [3, 4], direction: "top-to-bottom" },
    top_side: { pins: [5, 6], direction: "left-to-right" },
    bottom_side: { pins: [7, 8], direction: "left-to-right" },
  })
  expect(arrangement).toEqual(inputArrangement)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
