import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const computeSignedPolygonArea = (points: Array<{ x: number; y: number }>) => {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const current = points[i]!
    const next = points[(i + 1) % points.length]!
    area += current.x * next.y - next.x * current.y
  }
  return area / 2
}

const transformFootprintPoint = ({
  x,
  y,
  layer,
  pcbRotation,
  chipX,
  chipY,
}: {
  x: number
  y: number
  layer: "top" | "bottom"
  pcbRotation: number
  chipX: number
  chipY: number
}) => {
  const mirroredX = layer === "bottom" ? -x : x
  const rad = (pcbRotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: chipX + mirroredX * cos - y * sin,
    y: chipY + mirroredX * sin + y * cos,
  }
}

test("footprint rotation and bottom-layer flip transform plated hole drill offsets and polygon outlines", async () => {
  const { circuit } = getTestFixture()

  const placements = (["top", "bottom"] as const).flatMap((layer, row) =>
    [0, 90, 180, 270].map((pcbRotation, col) => ({
      layer,
      pcbRotation,
      pcbX: col * 10 - 15,
      rectRowY: row === 0 ? 11 : 3,
      polyRowY: row === 0 ? -5 : -13,
      rectChipName: `J${row * 4 + col + 1}`,
      polyChipName: `CN${row * 4 + col + 1}`,
    })),
  )

  circuit.add(
    <board width={46} height={38} routingDisabled schematicDisabled>
      {placements.map(
        ({ layer, pcbRotation, pcbX, rectRowY, rectChipName }) => (
          <chip
            key={rectChipName}
            name={rectChipName}
            layer={layer}
            pcbRotation={pcbRotation}
            pcbX={pcbX}
            pcbY={rectRowY}
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
                  pcbY={1.4}
                  portHints={["pin1"]}
                />
                <platedhole
                  shape="pill_hole_with_rect_pad"
                  holeShape="pill"
                  padShape="rect"
                  holeWidth={1.2}
                  holeHeight={0.7}
                  rectPadWidth={5}
                  rectPadHeight={2}
                  holeOffsetX={-1.4}
                  holeOffsetY={-0.2}
                  pcbY={-1.4}
                  portHints={["pin2"]}
                />
              </footprint>
            }
          />
        ),
      )}
      {placements.map(
        ({ layer, pcbRotation, pcbX, polyRowY, polyChipName }) => (
          <chip
            key={polyChipName}
            name={polyChipName}
            layer={layer}
            pcbRotation={pcbRotation}
            pcbX={pcbX}
            pcbY={polyRowY}
            cadModel={null}
            pinLabels={{ pin1: "VCC", pin2: "GND" }}
            footprint={
              <footprint>
                <platedhole
                  shape="hole_with_polygon_pad"
                  holeShape="circle"
                  holeDiameter={0.6}
                  holeOffsetX={0}
                  holeOffsetY={0}
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
                <silkscreenpath
                  route={[
                    { x: -0.8, y: -1 },
                    { x: 3.2, y: -1 },
                    { x: 3.2, y: 1 },
                    { x: -0.8, y: 1 },
                    { x: -0.8, y: -1 },
                  ]}
                  strokeWidth={0.08}
                />
              </footprint>
            }
          />
        ),
      )}
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "source_failed_to_create_component_error"),
  ).toHaveLength(0)
  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "pcb_pad_pad_clearance_error"),
  ).toHaveLength(0)

  const sourceComponents = circuit.db.source_component.list()
  const pcbComponents = circuit.db.pcb_component.list()

  for (const placement of placements) {
    const rectSource = sourceComponents.find(
      (s) => s.name === placement.rectChipName,
    )!
    const rectPcbComp = pcbComponents.find(
      (c) => c.source_component_id === rectSource.source_component_id,
    )!
    const rectHoles = circuit.db.pcb_plated_hole
      .list()
      .filter((h) => h.pcb_component_id === rectPcbComp.pcb_component_id)

    const circularHole = rectHoles.find(
      (h) => h.shape === "circular_hole_with_rect_pad",
    )
    if (!circularHole || circularHole.shape !== "circular_hole_with_rect_pad") {
      throw new Error("Expected circular_hole_with_rect_pad")
    }
    const pillHole = rectHoles.find(
      (h) =>
        h.shape === "pill_hole_with_rect_pad" ||
        h.shape === "rotated_pill_hole_with_rect_pad",
    )
    if (
      !pillHole ||
      (pillHole.shape !== "pill_hole_with_rect_pad" &&
        pillHole.shape !== "rotated_pill_hole_with_rect_pad")
    ) {
      throw new Error("Expected pill_hole_with_rect_pad")
    }

    const expectedCircularDrill = transformFootprintPoint({
      x: 1.5,
      y: 1.4 + 0.25,
      layer: placement.layer,
      pcbRotation: placement.pcbRotation,
      chipX: placement.pcbX,
      chipY: placement.rectRowY,
    })
    const expectedPillDrill = transformFootprintPoint({
      x: -1.4,
      y: -1.4 - 0.2,
      layer: placement.layer,
      pcbRotation: placement.pcbRotation,
      chipX: placement.pcbX,
      chipY: placement.rectRowY,
    })

    expect(circularHole.x + (circularHole.hole_offset_x ?? 0)).toBeCloseTo(
      expectedCircularDrill.x,
      6,
    )
    expect(circularHole.y + (circularHole.hole_offset_y ?? 0)).toBeCloseTo(
      expectedCircularDrill.y,
      6,
    )
    expect(pillHole.x + (pillHole.hole_offset_x ?? 0)).toBeCloseTo(
      expectedPillDrill.x,
      6,
    )
    expect(pillHole.y + (pillHole.hole_offset_y ?? 0)).toBeCloseTo(
      expectedPillDrill.y,
      6,
    )

    const polySource = sourceComponents.find(
      (s) => s.name === placement.polyChipName,
    )!
    const polyPcbComp = pcbComponents.find(
      (c) => c.source_component_id === polySource.source_component_id,
    )!
    const polygonHole = circuit.db.pcb_plated_hole
      .list()
      .find(
        (h) =>
          h.pcb_component_id === polyPcbComp.pcb_component_id &&
          h.shape === "hole_with_polygon_pad",
      )
    if (!polygonHole || polygonHole.shape !== "hole_with_polygon_pad") {
      throw new Error("Expected hole_with_polygon_pad")
    }

    expect(computeSignedPolygonArea(polygonHole.pad_outline)).toBeGreaterThan(0)
    if (placement.layer === "top") {
      expect(Math.min(...polygonHole.pad_outline.map((p) => p.x))).toBeCloseTo(
        -0.6,
        6,
      )
      expect(Math.max(...polygonHole.pad_outline.map((p) => p.x))).toBeCloseTo(
        3,
        6,
      )
    } else {
      expect(Math.min(...polygonHole.pad_outline.map((p) => p.x))).toBeCloseTo(
        -3,
        6,
      )
      expect(Math.max(...polygonHole.pad_outline.map((p) => p.x))).toBeCloseTo(
        0.6,
        6,
      )
    }
  }
})
