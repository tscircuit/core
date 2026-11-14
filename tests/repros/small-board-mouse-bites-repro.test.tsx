import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Issue #5066: tabs shrink on small boards, and the mouse-bite drills shrank
// with them to 0.27 mm at a 0.405 mm pitch, too small and too close to drill.
test("small-board mouse bites stay drillable", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      row={1}
      col={2}
      boardGap="2mm"
      panelizationMethod="tab-routing"
    >
      <board width="8mm" height="6mm" routingDisabled />
      <board width="8mm" height="6mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  // The first two drills of one tab show the drill size and pitch.
  expect(circuit.db.pcb_hole.list().slice(0, 2)).toMatchInlineSnapshot(`
    [
      {
        "hole_diameter": 0.27,
        "hole_shape": "circle",
        "pcb_hole_id": "panel_mouse_bite_0",
        "subcircuit_id": "subcircuit_source_group_2",
        "type": "pcb_hole",
        "x": -5.6075,
        "y": -3,
      },
      {
        "hole_diameter": 0.27,
        "hole_shape": "circle",
        "pcb_hole_id": "panel_mouse_bite_1",
        "subcircuit_id": "subcircuit_source_group_2",
        "type": "pcb_hole",
        "x": -5.2025,
        "y": -3,
      },
    ]
  `)
})
