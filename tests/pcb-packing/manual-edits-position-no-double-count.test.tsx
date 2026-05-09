import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Repro for: manualEdits.pcb_placements double-count the parent group's
// anchor. _computePcbGlobalTransformBeforeLayout composed manualPlacement
// (already absolute in the subcircuit's frame) with the parent's
// transform, so a cap manually placed at (11.4, 4.3) inside
// `<group pcbX={16}>` ended up at (27.4, 4.3) — the +16 region anchor
// was added on top of the absolute manual position.
test("manualEdits placement lands at absolute position, not parent-anchor + manual", () => {
  const { circuit } = getTestFixture()

  const manualEdits = {
    pcb_placements: [
      {
        selector: "C1",
        center: { x: 11.4, y: 4.3 },
        relative_to: "group_center",
      },
    ],
  } as any

  circuit.add(
    <board width="40mm" height="20mm" manualEdits={manualEdits}>
      <group name="region" pcbX={16} pcbY={0}>
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin8: "GND" }}
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

  const c1 = (() => {
    const src = circuit.db.source_component
      .list()
      .find((s) => s.name === "C1")!
    return circuit.db.pcb_component
      .list()
      .find((p) => p.source_component_id === src.source_component_id)!
  })()

  // Without the fix the cap would land at (11.4 + 16, 4.3) = (27.4, 4.3).
  // With the fix it lands at the absolute manual position (11.4, 4.3).
  expect(c1.center.x).toBeCloseTo(11.4, 1)
  expect(c1.center.y).toBeCloseTo(4.3, 1)
})

test("manualEdits placement also works when parent group is at origin (no regression)", () => {
  const { circuit } = getTestFixture()

  const manualEdits = {
    pcb_placements: [
      {
        selector: "C1",
        center: { x: 5, y: 2 },
        relative_to: "group_center",
      },
    ],
  } as any

  circuit.add(
    <board width="20mm" height="10mm" manualEdits={manualEdits}>
      <group name="region" pcbX={0} pcbY={0}>
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin8: "GND" }}
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

  const c1 = (() => {
    const src = circuit.db.source_component
      .list()
      .find((s) => s.name === "C1")!
    return circuit.db.pcb_component
      .list()
      .find((p) => p.source_component_id === src.source_component_id)!
  })()

  expect(c1.center.x).toBeCloseTo(5, 1)
  expect(c1.center.y).toBeCloseTo(2, 1)
})
