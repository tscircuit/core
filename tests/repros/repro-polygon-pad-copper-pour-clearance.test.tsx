import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: polygon signal pad receives zero copper-pour clearance", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm" routingDisabled>
      <net name="GND" isGroundNet />
      <net name="RECT_SIGNAL" />
      <net name="POLYGON_SIGNAL" />
      <chip
        name="U1"
        connections={{ pin1: "net.RECT_SIGNAL", pin2: "net.POLYGON_SIGNAL" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="2mm"
              height="2mm"
              pcbX={-3}
              layer="top"
              portHints={["pin1"]}
            />
            <smtpad
              shape="polygon"
              layer="top"
              portHints={["pin2"]}
              points={[
                { x: 2, y: -1 },
                { x: 4, y: -1 },
                { x: 4, y: 1 },
                { x: 2, y: 1 },
              ]}
            />
          </footprint>
        }
      />
      <copperpour connectsTo="net.GND" layer="top" padMargin="0.5mm" />
      <pcbnotetext
        text="GND POUR: padMargin = 0.5 mm"
        pcbY={3.6}
        fontSize="0.6mm"
      />
      <pcbnotetext text="RECT" pcbX={-3} pcbY={2.1} fontSize="0.55mm" />
      <pcbnotetext text="POLYGON" pcbX={3} pcbY={2.1} fontSize="0.55mm" />
      <pcbnotetext
        text="Expected: 0.5 mm gap around BOTH signal pads"
        pcbY={-3.2}
        fontSize="0.45mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, { layer: "top" })

  const [pour] = circuit.db.pcb_copper_pour.list()
  if (pour?.shape !== "brep") throw new Error("Expected a BRep copper pour")

  // Emitted positions are in circuit world space: mm, +X right, +Y up.
  // Both pads are axis-aligned squares, so the four side gaps measure clearance.
  const voidBounds = pour.brep_shape.inner_rings
    .map(({ vertices }) => ({
      minX: Math.min(...vertices.map((point) => point.x)),
      maxX: Math.max(...vertices.map((point) => point.x)),
      minY: Math.min(...vertices.map((point) => point.y)),
      maxY: Math.max(...vertices.map((point) => point.y)),
    }))
    .sort((a, b) => a.minX - b.minX)
  expect(voidBounds).toHaveLength(2)

  const pads = circuit.db.pcb_smtpad.list()
  const rectPad = pads.find((pad) => pad.shape === "rect")!
  const polygonPad = pads.find((pad) => pad.shape === "polygon")!
  const [rectVoid, polygonVoid] = voidBounds

  // Record the bug, not the desired behavior: only the polygon's gap is zero.
  expect({
    rectClearance: [
      rectPad.x - rectPad.width / 2 - rectVoid!.minX,
      rectVoid!.maxX - (rectPad.x + rectPad.width / 2),
      rectPad.y - rectPad.height / 2 - rectVoid!.minY,
      rectVoid!.maxY - (rectPad.y + rectPad.height / 2),
    ],
    polygonClearance: [
      Math.min(...polygonPad.points.map((point) => point.x)) -
        polygonVoid!.minX,
      polygonVoid!.maxX -
        Math.max(...polygonPad.points.map((point) => point.x)),
      Math.min(...polygonPad.points.map((point) => point.y)) -
        polygonVoid!.minY,
      polygonVoid!.maxY -
        Math.max(...polygonPad.points.map((point) => point.y)),
    ],
  }).toEqual({
    rectClearance: [0.5, 0.5, 0.5, 0.5],
    polygonClearance: [0, 0, 0, 0],
  })
})
