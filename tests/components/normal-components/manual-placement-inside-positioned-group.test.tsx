import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcb placement inside a positioned group uses board-absolute coordinates", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="40mm"
      height="20mm"
      routingDisabled
      manualEdits={{
        pcb_placements: [
          {
            selector: "C1",
            center: { x: 11.4, y: 4.3 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <group name="region" pcbX={16} pcbY={0}>
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin8: "GND" }}
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          connections={{ pin1: "U1.VCC", pin2: "U1.GND" }}
        />
      </group>
    </board>,
  )

  circuit.render()

  const capacitorSource = circuit.db.source_component.getWhere({ name: "C1" })
  const capacitor = circuit.db.pcb_component.getWhere({
    source_component_id: capacitorSource?.source_component_id,
  })

  expect(capacitor?.center.x).toBeCloseTo(11.4)
  expect(capacitor?.center.y).toBeCloseTo(4.3)
})
