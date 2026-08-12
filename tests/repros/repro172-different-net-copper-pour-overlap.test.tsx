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

test("repro172: different-net copper pours should clear each other", async () => {
  const { circuit } = getTestFixture()
  let copperPourSolverStartCount = 0

  circuit.on("solver:started", (event) => {
    if (event.solverName === "CopperPourPipelineSolver") {
      copperPourSolverStartCount++
    }
  })

  circuit.add(
    <board width="20mm" height="12mm">
      <net name="GND" isGroundNet />
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
        text="Different-net bottom pours are mutually cleared"
        pcbY={5.15}
        fontSize="0.45mm"
        color="#ffffff"
      />
      <pcbnoterect
        width="19mm"
        height="11mm"
        strokeWidth="0.12mm"
        color="#60a5fa"
        isStrokeDashed
      />
      <pcbnotetext
        text="GND: full-board pour"
        pcbX={-5.8}
        pcbY={4.25}
        fontSize="0.4mm"
        color="#60a5fa"
      />
      <pcbnoteline
        x1={-7.2}
        y1={4}
        x2={-8.4}
        y2={3.35}
        strokeWidth="0.12mm"
        color="#60a5fa"
      />
      <pcbnoterect
        width="4mm"
        height="4mm"
        strokeWidth="0.16mm"
        color="#facc15"
      />
      <pcbnotetext
        text="AISEN: inset pour"
        pcbX={5.1}
        pcbY={2.7}
        fontSize="0.4mm"
        color="#facc15"
      />
      <pcbnoteline
        x1={3.8}
        y1={2.45}
        x2={2}
        y2={1.5}
        strokeWidth="0.12mm"
        color="#facc15"
      />
      <pcbnoteline
        x1={-0.45}
        y1={0}
        x2={-0.1}
        y2={-0.35}
        strokeWidth="0.18mm"
        color="#34d399"
      />
      <pcbnoteline
        x1={-0.1}
        y1={-0.35}
        x2={0.55}
        y2={0.4}
        strokeWidth="0.18mm"
        color="#34d399"
      />
      <pcbnoteline
        x1={0}
        y1={-0.55}
        x2={0}
        y2={-2.45}
        strokeWidth="0.12mm"
        color="#34d399"
      />
      <pcbnotetext
        text="FIXED: center belongs to AISEN only"
        pcbY={-2.85}
        fontSize="0.45mm"
        color="#34d399"
      />
      <pcbnotetext
        text="0.2 mm clearance between pours"
        pcbY={-4.65}
        fontSize="0.4mm"
        color="#34d399"
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
  const poursContainingClearanceGap = bottomBrepPours.filter((pour) =>
    isPointInBrepShape({ x: 1.9, y: 0 }, pour.brep_shape),
  )
  const aisenSourceNetId = circuit.db.source_net
    .list()
    .find((sourceNet) => sourceNet.name === "AISEN")?.source_net_id

  expect(bottomBrepPours).toHaveLength(2)
  expect(copperPourSolverStartCount).toBe(1)
  expect(poursContainingBoardCenter).toHaveLength(1)
  expect(poursContainingBoardCenter[0]?.source_net_id).toBe(aisenSourceNetId)
  expect(poursContainingClearanceGap).toHaveLength(0)
})
