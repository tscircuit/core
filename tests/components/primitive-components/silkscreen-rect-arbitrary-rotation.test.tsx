import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen rectangles preserve local and parent rotation on both layers", () => {
  const { circuit } = getTestFixture()
  const angles = [0, 90, 180, 270, 30]
  circuit.add(
    <board width={60} height={30}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        angles.map((angle, i) => (
          <chip
            key={`U${row}_${i}`}
            name={`U${row}_${i}`}
            pcbX={-24 + i * 12}
            pcbY={row === 0 ? 7 : -7}
            pcbRotation={angle}
            layer={layer}
            footprint={
              <footprint>
                <silkscreenrect
                  width={4}
                  height={2}
                  pcbRotation={15}
                  filled={false}
                />
                <smtpad
                  shape="circle"
                  radius={0.15}
                  pcbX={2 * Math.cos(Math.PI / 12)}
                  pcbY={2 * Math.sin(Math.PI / 12)}
                  portHints={["1"]}
                />
                <silkscreentext
                  text={`${layer} ${angle}+15`}
                  pcbY={-4}
                  fontSize={0.6}
                />
              </footprint>
            }
          />
        )),
      )}
    </board>,
  )
  circuit.render()
  const rects = circuit.db.pcb_silkscreen_rect.list()
  const pads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "circle")
  expect(rects).toHaveLength(10)
  for (const rect of rects) {
    expect(rect.width).toBe(4)
    expect(rect.height).toBe(2)
    const pad = pads.find((p) => p.pcb_component_id === rect.pcb_component_id)!
    // A pad at the rectangle's local +X edge independently verifies orientation.
    const edgeAngle =
      (Math.atan2(pad.y - rect.center.y, pad.x - rect.center.x) * 180) / Math.PI
    const normalize = (angle: number) => ((angle % 180) + 180) % 180
    expect(normalize(rect.ccw_rotation ?? 0)).toBeCloseTo(
      normalize(edgeAngle),
      5,
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
