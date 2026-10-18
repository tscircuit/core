import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit pour on rounded board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} borderRadius={1.5}>
      <net name="GND" />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        boardEdgeMargin={0.3}
        outline={[
          { x: -5, y: 0 },
          { x: 5, y: 0 },
          { x: 5, y: 5 },
          { x: -5, y: 5 },
        ]}
      />
      <pcbnotetext
        text="Explicit GND pour on rounded board"
        pcbY={-2}
        fontSize={0.35}
      />
      <pcbnotetext
        text="Expected: 0.3 mm clearance at corners"
        pcbY={-3}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const clearanceErrors = circuit.db.pcb_placement_error.list()
  expect(clearanceErrors).toHaveLength(0)
  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours).toHaveLength(1)
  const pour = pours[0]!
  expect(pour.shape).toBe("brep")
  if (pour.shape !== "brep") throw new Error("Expected boundary representation")
  const cornerVertices = pour.brep_shape.outer_ring.vertices.filter(
    (vertex) => Math.abs(vertex.x) > 3.5 && vertex.y > 3.5,
  )
  expect(cornerVertices.length).toBeGreaterThan(0)
  for (const vertex of cornerVertices) {
    expect(
      Math.hypot(Math.abs(vertex.x) - 3.5, vertex.y - 3.5),
    ).toBeLessThanOrEqual(1.201)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
    showErrorsInTextOverlay: true,
  })
})
