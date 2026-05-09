import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Repro for: components placed via the board's `manualEdits.pcb_placements`
// were applied during _computePcbGlobalTransformBeforeLayout but then the
// auto-packer re-positioned them, silently undoing the user's pin.
//
// The packer marks a child as "static" (skip-repack) only if
// isRelativelyPositioned() returns true — and that helper checks
// pcbX/pcbY/pcbLeftEdgeX/etc., NOT manualEdits. The fix walks each
// descendant of the group being packed and adds its pcb_component_id
// to staticPcbComponentIds when the nearest subcircuit resolves a
// manual placement for it.
//
// Mirrors the failing case in loco-boardv2: a chip inside an anchored
// region with several auto-placed bottom-side caps. Without the fix the
// inner packer dumps every cap on top of the chip's network-minimum
// point; with manualEdits and the fix, the caps land at the requested
// coordinates instead.
test("manualEdits placements survive the auto-packer (inner-group case)", () => {
  const { circuit } = getTestFixture()

  const manualEdits = {
    pcb_placements: [
      { selector: "C1", center: { x: 5, y: 3 }, relative_to: "group_center" },
      { selector: "C2", center: { x: -5, y: 3 }, relative_to: "group_center" },
      { selector: "C3", center: { x: 5, y: -3 }, relative_to: "group_center" },
      { selector: "C4", center: { x: -5, y: -3 }, relative_to: "group_center" },
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
        <capacitor
          name="C2"
          capacitance="100nF"
          footprint="0402"
          connections={{ pin1: "U1.VCC", pin2: "U1.GND" }}
        />
        <capacitor
          name="C3"
          capacitance="100nF"
          footprint="0402"
          connections={{ pin1: "U1.VCC", pin2: "U1.GND" }}
        />
        <capacitor
          name="C4"
          capacitance="100nF"
          footprint="0402"
          connections={{ pin1: "U1.VCC", pin2: "U1.GND" }}
        />
      </group>
    </board>,
  )
  circuit.render()

  const named = (name: string) => {
    const src = circuit.db.source_component
      .list()
      .find((s) => s.name === name)!
    return circuit.db.pcb_component
      .list()
      .find((p) => p.source_component_id === src.source_component_id)!
  }

  const c1 = named("C1")
  const c2 = named("C2")
  const c3 = named("C3")
  const c4 = named("C4")

  expect(c1.center.x).toBeCloseTo(5, 1)
  expect(c1.center.y).toBeCloseTo(3, 1)
  expect(c2.center.x).toBeCloseTo(-5, 1)
  expect(c2.center.y).toBeCloseTo(3, 1)
  expect(c3.center.x).toBeCloseTo(5, 1)
  expect(c3.center.y).toBeCloseTo(-3, 1)
  expect(c4.center.x).toBeCloseTo(-5, 1)
  expect(c4.center.y).toBeCloseTo(-3, 1)
})
