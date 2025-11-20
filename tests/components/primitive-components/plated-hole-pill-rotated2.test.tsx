import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PlatedHole pill shape", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <platedhole
        shape="pill"
        outerWidth="2mm"
        outerHeight="4mm"
        holeWidth="1mm"
        holeHeight="2mm"
        pcbX={0}
        pcbY={0}
        pcbRotation={45}
      />
    </board>,
  )

  circuit.render()
  const platedHole = circuit.db.pcb_plated_hole.list()[0]
  expect(platedHole).toMatchInlineSnapshot(`
    {
      "ccw_rotation": 45,
      "hole_height": 2,
      "hole_width": 1,
      "is_covered_with_solder_mask": false,
      "layers": [
        "top",
        "bottom",
      ],
      "outer_height": 4,
      "outer_width": 2,
      "pcb_component_id": null,
      "pcb_group_id": undefined,
      "pcb_plated_hole_id": "pcb_plated_hole_0",
      "pcb_port_id": undefined,
      "port_hints": [
        "unnamed_platedhole1",
      ],
      "shape": "pill",
      "soldermask_margin": undefined,
      "subcircuit_id": "subcircuit_source_group_0",
      "type": "pcb_plated_hole",
      "x": 0,
      "y": 0,
    }
  `)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
