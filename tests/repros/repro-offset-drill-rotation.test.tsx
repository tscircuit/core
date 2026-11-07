import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("offset drill placement on a rotated copper pad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={14} height={8} routingDisabled>
      <pcbnotetext
        text="Offset drill must rotate with pad"
        pcbY={3}
        fontSize={0.6}
      />
      <pcbnotetext text="0 degrees" pcbX={-3} pcbY={-2.5} fontSize={0.6} />
      <pcbnotetext text="90 degrees" pcbX={3} pcbY={-2.5} fontSize={0.6} />
      <chip
        name="J1"
        pcbX={-3}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={0.5}
              rectPadWidth={3}
              rectPadHeight={1}
              holeOffsetX={0.8}
            />
          </footprint>
        }
      />
      <chip
        name="J2"
        pcbX={3}
        pcbRotation={90}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={0.5}
              rectPadWidth={3}
              rectPadHeight={1}
              holeOffsetX={0.8}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const [, rotatedHole] = circuit.db.pcb_plated_hole
    .list()
    .filter((hole) => hole.shape === "circular_hole_with_rect_pad")
  expect(rotatedHole.x + rotatedHole.hole_offset_x).toBeCloseTo(3)
  expect(rotatedHole.y + rotatedHole.hole_offset_y).toBeCloseTo(0.8)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
