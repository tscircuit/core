import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Synthetic footprint used to isolate offset-drill rotation. The AQI board
// connectors have centered holes; this is not an imported component from it.
const { circuit } = getTestFixture()
beforeAll(async () => {
  circuit.add(
    <board width={24} height={13} routingDisabled schematicDisabled>
      {[0, 90].map((angle, i) => (
        <chip
          key={angle}
          name={`J${i + 1}`}
          pcbX={i === 0 ? -6 : 6}
          pcbRotation={angle}
          cadModel={null}
          pinLabels={{ pin1: "CONTACT" }}
          footprint={
            <footprint>
              <platedhole
                shape="circular_hole_with_rect_pad"
                rectPadWidth={5}
                rectPadHeight={2}
                holeDiameter={0.8}
                holeOffsetX={1.5}
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        text="0 deg: hole inside pad"
        pcbX={-6}
        pcbY={4.5}
        fontSize={0.55}
      />
      <pcbnotetext
        text="90 deg: hole OUTSIDE pad"
        pcbX={6}
        pcbY={4.5}
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    camPos: [0, 18, -12],
    poppygl: { grid: false, width: 1000, height: 650 },
  })
  const holes = circuit.db.pcb_plated_hole.list()
  expect(holes).toHaveLength(2)
  const control = holes[0]
  if (control.shape !== "circular_hole_with_rect_pad")
    throw new Error("Wrong hole shape")
  expect(control.hole_offset_x).toBe(1.5)
  expect(control.rect_ccw_rotation).toBe(0)
}, 30_000)

test.failing(
  "component rotation moves an offset drill with its copper pad",
  () => {
    const hole = circuit.db.pcb_plated_hole.list()[1]
    if (hole.shape !== "circular_hole_with_rect_pad")
      throw new Error("Wrong hole shape")
    // Circuit JSON offsets are board-axis offsets from the pad center.
    // A +X offset becomes +Y after the whole footprint turns 90 degrees.
    expect(hole.hole_offset_x ?? 0).toBeCloseTo(0)
    expect(hole.hole_offset_y ?? 0).toBeCloseTo(1.5)
  },
)
