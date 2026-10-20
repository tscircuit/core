import { expect, test } from "bun:test"
import type { PcbHoleWithPolygonPad } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported polygon plated pads preserve rotation and local drill geometry", () => {
  for (const rotation of [undefined, 0, 90, 180, 270, 37, -90]) {
    const { circuit } = getTestFixture()
    const importedHole = {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "imported_polygon_hole",
      shape: "hole_with_polygon_pad",
      hole_shape: "pill",
      hole_width: 1.9,
      hole_height: 0.6,
      hole_offset_x: 0.4,
      hole_offset_y: -0.25,
      pad_outline: [
        { x: -2, y: -1 },
        { x: 2, y: -1 },
        { x: 1, y: 1 },
        { x: -2, y: 1 },
      ],
      x: 2,
      y: 1,
      ccw_rotation: rotation,
      layers: ["top", "bottom"],
    } satisfies PcbHoleWithPolygonPad
    const originalHole = structuredClone(importedHole)
    const board = new Board({ width: 16, height: 16 })
    for (const primitive of createComponentsFromCircuitJson(
      { componentName: "", componentRotation: "0" },
      [importedHole],
    )) {
      board.add(primitive)
    }
    circuit.add(board)
    circuit.render()

    const renderedHoles = circuit.db.pcb_plated_hole.list()
    expect(renderedHoles).toHaveLength(1)
    const renderedHole = renderedHoles.find(
      (hole) => hole.shape === "hole_with_polygon_pad",
    )!
    expect(renderedHole).toMatchObject({
      shape: importedHole.shape,
      hole_shape: importedHole.hole_shape,
      hole_width: importedHole.hole_width,
      hole_height: importedHole.hole_height,
      pad_outline: importedHole.pad_outline,
      hole_offset_x: importedHole.hole_offset_x,
      hole_offset_y: importedHole.hole_offset_y,
      x: importedHole.x,
      y: importedHole.y,
    })
    expect(renderedHole.ccw_rotation ?? 0).toBeCloseTo(
      (((rotation ?? 0) % 360) + 360) % 360,
      6,
    )
    expect(importedHole).toEqual(originalHole)
  }
  // circuit-to-svg ignores this shape's rotation, so verify emitted data.
})
