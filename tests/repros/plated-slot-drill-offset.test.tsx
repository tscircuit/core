import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an offset plated slot follows a reference pad through each mounting transform", async () => {
  const { circuit } = getTestFixture()
  const rotations = [0, 90, 180, 270, 30]
  circuit.add(
    <board width={44} height={18} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        rotations.map((rotation, i) => (
          <chip
            key={`${layer}-${rotation}`}
            name={`J${row * 5 + i + 1}`}
            layer={layer}
            pcbRotation={rotation}
            pcbX={(i - 2) * 8}
            pcbY={4 - row * 8}
            footprint={
              <footprint originalLayer="top">
                <platedhole
                  shape="pill_hole_with_rect_pad"
                  holeWidth={1}
                  holeHeight={0.5}
                  rectPadWidth={2.5}
                  rectPadHeight={1.5}
                  holeOffsetX={0.5}
                  holeOffsetY={0.2}
                />
                <smtpad
                  shape="circle"
                  radius={0.12}
                  pcbX={0.5}
                  pcbY={0.2}
                  layer="bottom"
                />
              </footprint>
            }
          />
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_plated_hole.list()
  expect(holes).toHaveLength(10)
  for (const hole of holes) {
    if (
      hole.shape !== "pill_hole_with_rect_pad" &&
      hole.shape !== "rotated_pill_hole_with_rect_pad"
    )
      throw new Error("Expected a plated slot")
    const reference = circuit.db.pcb_smtpad
      .list()
      .find((pad) => pad.pcb_component_id === hole.pcb_component_id)!
    expect(hole.x + hole.hole_offset_x).toBeCloseTo(reference.x, 8)
    expect(hole.y + hole.hole_offset_y).toBeCloseTo(reference.y, 8)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
