import { expect, test } from "bun:test"
import { compose, rotate, translate } from "transformation-matrix"
import { transformPcbElementsWithHoleRotation } from "lib/utils/pcb/transform-pcb-elements-with-hole-rotation"

test("transformPcbElementsWithHoleRotation rotates every rotatable hole shape", () => {
  const base = { layers: ["top", "bottom"], x: 1, y: 0 }
  const elements: any[] = [
    {
      ...base,
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pill",
      shape: "pill",
      outer_width: 1.2,
      outer_height: 2,
      hole_width: 0.8,
      hole_height: 1.5,
      ccw_rotation: 0,
    },
    {
      ...base,
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "oval",
      shape: "oval",
      outer_width: 1.2,
      outer_height: 2,
      hole_width: 0.8,
      hole_height: 1.5,
      ccw_rotation: 30,
    },
    {
      ...base,
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pill_rect",
      shape: "pill_hole_with_rect_pad",
      hole_shape: "pill",
      pad_shape: "rect",
      hole_width: 0.8,
      hole_height: 1.4,
      rect_pad_width: 1.2,
      rect_pad_height: 1.8,
      hole_offset_x: 0,
      hole_offset_y: 0,
    },
    {
      ...base,
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "rotated_pill_rect",
      shape: "rotated_pill_hole_with_rect_pad",
      hole_shape: "rotated_pill",
      pad_shape: "rect",
      hole_width: 0.8,
      hole_height: 1.4,
      hole_ccw_rotation: 90,
      rect_pad_width: 1.2,
      rect_pad_height: 1.8,
      rect_ccw_rotation: 90,
      hole_offset_x: 0,
      hole_offset_y: 0,
    },
    {
      ...base,
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "circle_rect",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_diameter: 0.8,
      rect_pad_width: 1.2,
      rect_pad_height: 1.8,
      hole_offset_x: 0,
      hole_offset_y: 0,
    },
    {
      ...base,
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "polygon",
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: 0.8,
      pad_outline: [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
      ],
      hole_offset_x: 0,
      hole_offset_y: 0,
    },
    {
      ...base,
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "circle",
      shape: "circle",
      outer_diameter: 1.2,
      hole_diameter: 0.8,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "npth_pill",
      hole_shape: "pill",
      hole_width: 0.6,
      hole_height: 1.2,
      x: 1,
      y: 0,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "paste",
      shape: "rotated_pill",
      layer: "top",
      width: 1.2,
      height: 2,
      radius: 0.6,
      ccw_rotation: 0,
      x: 1,
      y: 0,
    },
  ]

  // Same shape of matrix applyPackOutput builds; the float noise in the angle
  // mirrors the -90.00000000000001 rotation the packer produces.
  const matrix = compose(
    translate(10, 5),
    rotate((-90.00000000000001 * Math.PI) / 180),
    translate(0, 0),
  )
  transformPcbElementsWithHoleRotation(elements, matrix)

  const byId = (id: string) =>
    elements.find(
      (e) =>
        e.pcb_plated_hole_id === id ||
        e.pcb_hole_id === id ||
        e.pcb_solder_paste_id === id,
    )

  // Positions still move with the transform.
  expect(byId("pill").x).toBeCloseTo(10, 6)
  expect(byId("pill").y).toBeCloseTo(4, 6)

  expect(byId("pill").ccw_rotation).toBe(270)
  expect(byId("oval").ccw_rotation).toBe(300)
  expect(byId("pill_rect")).toMatchObject({
    shape: "rotated_pill_hole_with_rect_pad",
    hole_shape: "rotated_pill",
    hole_ccw_rotation: 270,
    rect_ccw_rotation: 270,
    rect_pad_width: 1.2,
    rect_pad_height: 1.8,
  })
  expect(byId("rotated_pill_rect")).toMatchObject({
    hole_ccw_rotation: 0,
    rect_ccw_rotation: 0,
  })
  expect(byId("circle_rect").rect_ccw_rotation).toBe(270)
  expect(byId("polygon").ccw_rotation).toBe(270)
  expect(byId("circle").ccw_rotation).toBeUndefined()
  expect(byId("npth_pill")).toMatchObject({
    hole_shape: "rotated_pill",
    ccw_rotation: 270,
  })
  expect(byId("paste").ccw_rotation).toBe(270)
})
