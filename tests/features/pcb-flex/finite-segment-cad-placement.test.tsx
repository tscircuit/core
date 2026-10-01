import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  boundsOfTriangles,
  extrudePolygon,
  foldSurfaceMesh,
  rotateVector,
  transformCircuitJsonCadComponents,
  type Point2,
  type Triangle,
} from "@tscircuit/flex-utils"
import type { CadComponent } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board/Board"
import "tests/fixtures/extend-expect-png-matcher"
import { renderSurfaceMeshes } from "tests/fixtures/render-surface-meshes"

const outline = [
  { x: -20, y: -10 },
  { x: 20, y: -10 },
  { x: 20, y: 30 },
  { x: 12, y: 30 },
  { x: 12, y: 10 },
  { x: -12, y: 10 },
  { x: -12, y: 30 },
  { x: -20, y: 30 },
]

/** Colored CAD markers in the right-handed board-local frame, in mm:
 * +X right, +Y top, +Z above. Apply core's emitted XYZ-degree rotation to
 * model-local points and normal directions; only points pick up translation.
 * Markers are enlarged for visibility, rather than rendering resistor models.
 */
function createCadMarker(cad: CadComponent, boardCenter: Point2) {
  const marker = extrudePolygon({
    outline: [
      { x: -1, y: -0.5 },
      { x: 1, y: -0.5 },
      { x: 1, y: 0.5 },
      { x: -1, y: 0.5 },
    ],
    bottom: 0,
    top: 0.54,
  })
  const rotation = cad.rotation ?? { x: 0, y: 0, z: 0 }
  const triangles = marker.triangles.map((triangle) => ({
    vertices: triangle.vertices.map((vertex) => {
      const rotated = rotateVector(vertex, rotation)
      return {
        x: rotated.x + cad.position.x - boardCenter.x,
        y: rotated.y + cad.position.y - boardCenter.y,
        z: rotated.z + cad.position.z,
      }
    }) as Triangle["vertices"],
    normal: rotateVector(triangle.normal, rotation),
  }))
  return { triangles, boundingBox: boundsOfTriangles(triangles) }
}

test("finite bend folds only its tail before CAD insertion, including a translated board", async () => {
  for (const offset of [
    { x: 0, y: 0 },
    { x: 100, y: -70 },
  ]) {
    const render = async (bent: boolean) => {
      const { circuit } = getTestFixture()
      circuit.add(
        <board
          material="flex"
          layers={2}
          thickness={0.12}
          routingDisabled
          schematicDisabled
          pcbX={offset.x}
          pcbY={offset.y}
          outline={outline.map((point) => ({
            x: point.x + offset.x,
            y: point.y + offset.y,
          }))}
        >
          {bent && (
            <pcbbend
              x1={-20}
              y1={20}
              x2={-12}
              y2={20}
              bendAngle={90}
              bendRadius={1}
              bendSide="left"
            />
          )}
          <resistor
            name="RL"
            resistance="1k"
            footprint="0402"
            pcbX={-16}
            pcbY={25}
          />
          <resistor
            name="RR"
            resistance="1k"
            footprint="0402"
            pcbX={16}
            pcbY={25}
          />
        </board>,
      )
      await circuit.renderUntilSettled()
      return circuit
    }
    const flat = await render(false)
    const folded = await render(true)
    expect(folded.db.pcb_component.list()).toEqual(flat.db.pcb_component.list())
    const [left, right] = folded.db.cad_component.list()
    const [flatLeft, flatRight] = flat.db.cad_component.list()
    expect(left!.position.z).toBeCloseTo(6 - Math.PI / 4, 7)
    expect(left!.rotation!.x).toBeCloseTo(90, 7)
    expect(left!.position.x).toBeCloseTo(flatLeft!.position.x, 7)
    expect(right!.position).toEqual(flatRight!.position)
    for (const coordinate of ["x", "y", "z"] as const)
      expect(right!.rotation![coordinate]).toBeCloseTo(
        flatRight!.rotation![coordinate],
        7,
      )
    const restored = transformCircuitJsonCadComponents(
      folded.getCircuitJson(),
      { foldPcbs: false },
    ).filter((element) => element.type === "cad_component")
    for (let i = 0; i < restored.length; i++)
      for (const coordinate of ["x", "y", "z"] as const)
        expect(restored[i]!.position[coordinate]).toBeCloseTo(
          flat.db.cad_component.list()[i]!.position[coordinate],
          7,
        )

    for (const circuit of [flat, folded]) {
      const pcbBoard = circuit.db.pcb_board.list()[0]!
      const board = circuit.firstChild as Board
      const boardMesh = extrudePolygon({
        outline: pcbBoard.outline!.map((point) => ({
          x: point.x - pcbBoard.center.x,
          y: point.y - pcbBoard.center.y,
        })),
        bottom: -pcbBoard.thickness! / 2,
        top: pcbBoard.thickness! / 2,
      })
      const cadComponents = circuit.db.cad_component.list()
      // Use the actual core Board fold, not an independently reconstructed
      // fold or the GLTF exporter's currently bundled older implementation.
      const png = await renderSurfaceMeshes(
        [
          {
            mesh: board.pcbFold
              ? foldSurfaceMesh(boardMesh, board.pcbFold)
              : boardMesh,
            color: [0.85, 0.52, 0.12, 1],
          },
          {
            mesh: createCadMarker(cadComponents[0]!, pcbBoard.center),
            color: [0.8, 0.12, 0.1, 1],
          },
          {
            mesh: createCadMarker(cadComponents[1]!, pcbBoard.center),
            color: [0.08, 0.3, 0.8, 1],
          },
        ],
        {
          debugPoints: cadComponents.map((cad, i) => ({
            label: i === 0 ? "RL" : "RR",
            position: {
              x: cad.position.x - pcbBoard.center.x,
              y: cad.position.y - pcbBoard.center.y,
              z: cad.position.z,
            },
          })),
          debugFontSize: 20,
          debugLabelColor: [0.08, 0.1, 0.15],
        },
      )
      await expect(png).toMatchPngSnapshot(
        import.meta.path,
        circuit === flat ? "finite-segment-flat" : "finite-segment-folded",
      )
    }
  }
})
