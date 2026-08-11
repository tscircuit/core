import { expect, test } from "bun:test"
import type { BRepShape, PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Point = { x: number; y: number }

const isPointInPolygon = (point: Point, vertices: Point[]) => {
  let isInside = false

  for (
    let vertexIndex = 0, previousVertexIndex = vertices.length - 1;
    vertexIndex < vertices.length;
    previousVertexIndex = vertexIndex++
  ) {
    const vertex = vertices[vertexIndex]!
    const previousVertex = vertices[previousVertexIndex]!

    if (
      vertex.y > point.y !== previousVertex.y > point.y &&
      point.x <
        ((previousVertex.x - vertex.x) * (point.y - vertex.y)) /
          (previousVertex.y - vertex.y) +
          vertex.x
    ) {
      isInside = !isInside
    }
  }

  return isInside
}

const isPointInBrepShape = (point: Point, brepShape: BRepShape) =>
  isPointInPolygon(point, brepShape.outer_ring.vertices) &&
  !brepShape.inner_rings.some((innerRing) =>
    isPointInPolygon(point, innerRing.vertices),
  )

const aisenPourOutline = [
  { x: -2, y: -2 },
  { x: 2, y: -2 },
  { x: 2, y: 2 },
  { x: -2, y: 2 },
  { x: -2, y: -2 },
]

test.failing(
  "repro172: different-net copper pours should clear each other",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="12mm">
        <net name="GND" />
        <net name="AISEN" />
        <copperpour
          name="GND_BOTTOM"
          connectsTo="net.GND"
          layer="bottom"
          clearance="0.2mm"
        />
        <copperpour
          name="AISEN_BOTTOM"
          connectsTo="net.AISEN"
          layer="bottom"
          clearance="0.2mm"
          outline={aisenPourOutline}
        />
        <pcbnotetext
          text="BUG: GND and AISEN pours overlap at center"
          pcbY={4.8}
          fontSize="0.35mm"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const pcbErrors = circuit
      .getCircuitJson()
      .filter(
        (element) =>
          element.type.startsWith("pcb_") && element.type.endsWith("_error"),
      )
    expect(pcbErrors).toHaveLength(0)

    const bottomBrepPours = circuit.db.pcb_copper_pour
      .list()
      .filter(
        (pour): pour is PcbCopperPourBRep =>
          pour.shape === "brep" && pour.layer === "bottom",
      )
    const poursContainingBoardCenter = bottomBrepPours.filter((pour) =>
      isPointInBrepShape({ x: 0, y: 0 }, pour.brep_shape),
    )

    expect(bottomBrepPours).toHaveLength(2)
    expect(poursContainingBoardCenter.length).toBeLessThanOrEqual(1)
  },
)
