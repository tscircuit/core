import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PlatedHole transforms holeOffsetX and holeOffsetY under footprint rotation and bottom-side flip", async () => {
  const { circuit } = getTestFixture()
  const angles = [0, 90, 180, 270] as const

  circuit.add(
    <board width={48} height={24} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        angles.map((angle, col) => (
          <chip
            key={`${layer}-${angle}`}
            name={`J_${layer}_${angle}`}
            layer={layer}
            pcbRotation={angle}
            pcbX={col * 10 - 15}
            pcbY={row === 0 ? 5 : -5}
            cadModel={null}
            pinLabels={{ pin1: "P1", pin2: "P2" }}
            footprint={
              <footprint>
                <platedhole
                  shape="circular_hole_with_rect_pad"
                  rectPadWidth={5}
                  rectPadHeight={2}
                  holeDiameter={0.8}
                  holeOffsetX={1.5}
                  holeOffsetY={0.25}
                  pcbY={1.5}
                  portHints={["pin1"]}
                />
                <platedhole
                  shape="pill_hole_with_rect_pad"
                  rectPadWidth={5}
                  rectPadHeight={2}
                  holeWidth={0.8}
                  holeHeight={1.2}
                  holeOffsetX={1.5}
                  holeOffsetY={-0.25}
                  pcbY={-1.5}
                  portHints={["pin2"]}
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
  expect(holes).toHaveLength(16)

  const expectedCircularOffsets: Record<string, [number, number]> = {
    "top-0": [1.5, 0.25],
    "top-90": [-0.25, 1.5],
    "top-180": [-1.5, -0.25],
    "top-270": [0.25, -1.5],
    "bottom-0": [-1.5, 0.25],
    "bottom-90": [-0.25, -1.5],
    "bottom-180": [1.5, -0.25],
    "bottom-270": [0.25, 1.5],
  }

  for (const layer of ["top", "bottom"] as const) {
    for (const angle of angles) {
      const comp = circuit.db.source_component.getWhere({
        name: `J_${layer}_${angle}`,
      })!
      const pcbComp = circuit.db.pcb_component.getWhere({
        source_component_id: comp.source_component_id,
      })!
      const compHoles = holes.filter(
        (h) => h.pcb_component_id === pcbComp.pcb_component_id,
      )
      const circular = compHoles.find(
        (h) => h.shape === "circular_hole_with_rect_pad",
      )!
      const [expX, expY] = expectedCircularOffsets[`${layer}-${angle}`]!
      expect(circular.hole_offset_x).toBeCloseTo(expX, 6)
      expect(circular.hole_offset_y).toBeCloseTo(expY, 6)

      const pill = compHoles.find(
        (h) =>
          h.shape === "pill_hole_with_rect_pad" ||
          h.shape === "rotated_pill_hole_with_rect_pad",
      )!
      if (
        pill.shape !== "pill_hole_with_rect_pad" &&
        pill.shape !== "rotated_pill_hole_with_rect_pad"
      ) {
        throw new Error("Unexpected plated hole shape")
      }
      const flipSign = layer === "bottom" ? -1 : 1
      const rad = (angle * Math.PI) / 180
      const localX = flipSign * 1.5
      const localY = -0.25
      expect(pill.hole_offset_x).toBeCloseTo(
        localX * Math.cos(rad) - localY * Math.sin(rad),
        6,
      )
      expect(pill.hole_offset_y).toBeCloseTo(
        localX * Math.sin(rad) + localY * Math.cos(rad),
        6,
      )
    }
  }
})

test("flipping an asymmetric hole_with_polygon_pad mirrors pad_outline and preserves contact clearance", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={24} height={13} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).map((layer, i) => (
        <chip
          key={layer}
          name={`J${i + 1}`}
          pcbX={i === 0 ? -6 : 6}
          layer={layer}
          cadModel={null}
          pinLabels={{ pin1: "VCC", pin2: "GND" }}
          footprint={
            <footprint>
              <platedhole
                shape="hole_with_polygon_pad"
                holeShape="circle"
                holeDiameter={0.6}
                holeOffsetX={0.4}
                holeOffsetY={0.1}
                padOutline={[
                  { x: -0.6, y: -0.8 },
                  { x: 3, y: -0.8 },
                  { x: 3, y: 0.8 },
                  { x: -0.6, y: 0.8 },
                ]}
                portHints={["pin1"]}
              />
              <platedhole
                shape="circle"
                holeDiameter={0.4}
                outerDiameter={0.8}
                pcbX={-1.8}
                portHints={["pin2"]}
              />
            </footprint>
          }
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const clearanceErrors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_pad_pad_clearance_error")
  expect(clearanceErrors).toHaveLength(0)

  const polygonHoles = circuit.db.pcb_plated_hole
    .list()
    .filter((h) => h.shape === "hole_with_polygon_pad")
  expect(polygonHoles).toHaveLength(2)

  const [topHole, bottomHole] = polygonHoles
  expect(topHole!.hole_offset_x).toBeCloseTo(0.4, 6)
  expect(topHole!.hole_offset_y).toBeCloseTo(0.1, 6)
  expect(bottomHole!.hole_offset_x).toBeCloseTo(-0.4, 6)
  expect(bottomHole!.hole_offset_y).toBeCloseTo(0.1, 6)

  const bottomXs = bottomHole!.pad_outline.map((p) => p.x)
  expect(Math.min(...bottomXs)).toBeCloseTo(-3, 6)
  expect(Math.max(...bottomXs)).toBeCloseTo(0.6, 6)

  // Verify counter-clockwise winding is preserved after horizontal reflection
  const signedArea2 = bottomHole!.pad_outline.reduce((sum, p, idx, arr) => {
    const next = arr[(idx + 1) % arr.length]!
    return sum + (p.x * next.y - next.x * p.y)
  }, 0)
  expect(signedArea2).toBeGreaterThan(0)
})
