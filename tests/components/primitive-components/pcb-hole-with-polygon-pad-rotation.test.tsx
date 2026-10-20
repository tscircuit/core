import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polygon plated pads retain component rotation and local geometry on both layers", async () => {
  const { circuit } = getTestFixture()
  const padOutline = [
    { x: -2, y: -0.5 },
    { x: 2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: -2, y: 0.5 },
  ]
  const originalOutline = structuredClone(padOutline)
  const placements = (["top", "bottom"] as const).flatMap((layer, row) =>
    [0, 90, 180, 270, 37, -90].map((pcbRotation, column) => ({
      name: `U_${layer}_${column}`,
      layer,
      pcbRotation,
      pcbX: -32.5 + column * 13,
      pcbY: 7 - row * 14,
    })),
  )

  circuit.add(
    <board width={78} height={30} routingDisabled>
      {placements.map((placement) => (
        <chip
          key={placement.name}
          {...placement}
          cadModel={null}
          pinLabels={{ pin1: "POLYGON", pin2: "RECT" }}
          footprint={
            <footprint>
              <platedhole
                portHints={["pin1"]}
                pcbX={2}
                shape="hole_with_polygon_pad"
                holeShape="circle"
                holeDiameter={0.5}
                holeOffsetX={0.7}
                holeOffsetY={0.15}
                padOutline={padOutline}
              />
              <platedhole
                portHints={["pin2"]}
                pcbX={-2}
                shape="circular_hole_with_rect_pad"
                holeDiameter={0.5}
                rectPadWidth={4}
                rectPadHeight={1}
                holeOffsetX={0.7}
                holeOffsetY={0.15}
              />
            </footprint>
          }
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  for (const placement of placements) {
    const sourceChip = circuit.db.source_component.getWhere({
      name: placement.name,
    })!
    const pcbChip = circuit.db.pcb_component.getWhere({
      source_component_id: sourceChip.source_component_id,
    })!
    const platedHoles = circuit.db.pcb_plated_hole.list({
      pcb_component_id: pcbChip.pcb_component_id,
    })
    const polygonPadHole = platedHoles.find(
      (hole) => hole.shape === "hole_with_polygon_pad",
    )!
    const rectPadHole = platedHoles.find(
      (hole) => hole.shape === "circular_hole_with_rect_pad",
    )!

    // Compare emitted orientations rather than restating the placement transform.
    expect(polygonPadHole.ccw_rotation ?? 0).toBeCloseTo(
      rectPadHole.rect_ccw_rotation ?? 0,
      6,
    )
    // Consumers rotate these local points and displacements using ccw_rotation.
    // Baking the component transform into them would apply it twice.
    expect(polygonPadHole.pad_outline).toEqual(originalOutline)
    expect(polygonPadHole.hole_offset_x).toBe(0.7)
    expect(polygonPadHole.hole_offset_y).toBe(0.15)
  }
  expect(padOutline).toEqual(originalOutline)
  // circuit-to-svg currently ignores polygon-pad ccw_rotation. Assert the
  // emitted Circuit JSON directly so an SVG cannot hide a missing rotation.
})
