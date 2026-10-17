import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copperpour with an explicit outline is clipped to a rounded board outline", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" borderRadius={1.5}>
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
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbPlacementErrors = circuit.db.pcb_placement_error.list()
  expect(pcbPlacementErrors).toHaveLength(0)

  const pours = circuit.db.pcb_copper_pour
    .list()
    .filter((pour): pour is PcbCopperPourBRep => pour.shape === "brep")
  expect(pours).toHaveLength(1)

  for (const vertex of pours[0]!.brep_shape.outer_ring.vertices) {
    // Top-right and top-left rounded corners have arc centers at (+/-3.5, 3.5) with radius 1.5
    if (Math.abs(vertex.x) > 3.5 && vertex.y > 3.5) {
      const cornerCenterX = Math.sign(vertex.x) * 3.5
      const distFromCornerArcCenter = Math.hypot(
        vertex.x - cornerCenterX,
        vertex.y - 3.5,
      )
      expect(distFromCornerArcCenter).toBeLessThanOrEqual(1.5 - 0.3 + 1e-2)
    }
  }
})

test("copperpour with full-board rectangular outline is clipped to a rounded board outline", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" borderRadius={1.5}>
      <net name="GND" />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        boardEdgeMargin={0.3}
        outline={[
          { x: -5, y: -5 },
          { x: 5, y: -5 },
          { x: 5, y: 5 },
          { x: -5, y: 5 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbPlacementErrors = circuit.db.pcb_placement_error.list()
  expect(pcbPlacementErrors).toHaveLength(0)
})
