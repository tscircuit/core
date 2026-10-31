import { expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type {
  PcbHoleCircularWithRectPad,
  PcbSilkscreenPath,
} from "circuit-json"
import { Fragment } from "react"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported plated-pad rotation matches its corner path on both layers", async () => {
  const { circuit } = getTestFixture()
  // Footprint-local points: mm, +X right, +Y top, +Z above, right-handed.
  // The path explicitly records the rectangle corners before board placement.
  // It provides an independent geometry reference after import and reflection.
  const corners = [
    { x: -3, y: -1 },
    { x: 3, y: -1 },
    { x: 3, y: 1 },
    { x: -3, y: 1 },
  ]
  const rotations = [
    { localRotation: 35, parentRotation: 0 },
    { localRotation: 35, parentRotation: 90 },
    { localRotation: 35, parentRotation: 180 },
    { localRotation: 35, parentRotation: 270 },
    { localRotation: 35, parentRotation: 25 },
    { localRotation: undefined, parentRotation: 0 },
    { localRotation: 90, parentRotation: 0 },
    { localRotation: 180, parentRotation: 0 },
    { localRotation: 270, parentRotation: 0 },
  ]
  const footprints = rotations.map(({ localRotation }) => [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "imported_hole",
      pcb_component_id: "imported_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      x: 1,
      y: 0.5,
      hole_diameter: 0.8,
      hole_offset_x: 0,
      hole_offset_y: 0,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: localRotation,
      layers: ["top", "bottom"],
    } satisfies PcbHoleCircularWithRectPad,
    {
      type: "pcb_silkscreen_path",
      pcb_silkscreen_path_id: "imported_outline",
      pcb_component_id: "imported_component",
      layer: "top",
      stroke_width: 0.08,
      route: [...corners, corners[0]].map((corner) =>
        applyToPoint(
          compose(translate(1, 0.5), rotateDEG(localRotation ?? 0)),
          corner,
        ),
      ),
    } satisfies PcbSilkscreenPath,
  ])
  const inputBefore = JSON.stringify(footprints)
  circuit.add(
    <board width={126} height={42} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Imported plated-pad: edges should match thin corner paths"
        pcbY={18}
        fontSize={1}
      />
      {(["top", "bottom"] as const).flatMap((layer, side) =>
        rotations.map(({ localRotation, parentRotation }, column) => (
          <Fragment key={`${layer}-${column}`}>
            <pcbnotetext
              text={`${layer} local ${localRotation ?? 0} / chip ${parentRotation}`}
              pcbX={column * 13 - 52}
              pcbY={11 - side * 18}
              fontSize={0.6}
            />
            <chip
              name={`U${side}${column}`}
              layer={layer}
              pcbX={column * 13 - 52}
              pcbY={6 - side * 18}
              pcbRotation={parentRotation}
              footprint={footprints[column] as unknown as FootprintProp}
            />
          </Fragment>
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  const rects = circuit.db.pcb_plated_hole
    .list()
    .filter(
      (hole): hole is PcbHoleCircularWithRectPad =>
        hole.shape === "circular_hole_with_rect_pad",
    )
  expect(rects).toHaveLength(rotations.length * 2)
  for (const rect of rects) {
    const path = circuit.db.pcb_silkscreen_path
      .list()
      .find((path) => path.pcb_component_id === rect.pcb_component_id)!
    const rectLocalToBoard = compose(
      translate(rect.x, rect.y),
      rotateDEG(rect.rect_ccw_rotation ?? 0),
    )
    const boardCorners = [-1, 1].flatMap((x) =>
      [-1, 1].map((y) =>
        applyToPoint(rectLocalToBoard, {
          x: (x * rect.rect_pad_width) / 2,
          y: (y * rect.rect_pad_height) / 2,
        }),
      ),
    )
    for (const corner of path.route.slice(0, 4)) {
      const error = Math.min(
        ...boardCorners.map((actual) =>
          Math.hypot(actual.x - corner.x, actual.y - corner.y),
        ),
      )
      expect(error).toBeLessThan(0.000001)
    }
  }
  expect(JSON.stringify(footprints)).toBe(inputBefore)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
