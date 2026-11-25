import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit copperpour outline is not shrunk by boardEdgeMargin away from board edges", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <net name="GND" />
      <net name="VCC" />
      <net name="EDGE" />
      <copperpour
        name="POUR_CENTER_BOX"
        connectsTo="net.GND"
        layer="top"
        clearance="0.5mm"
        outline={[
          { x: -2, y: -2 },
          { x: 2, y: -2 },
          { x: 2, y: 2 },
          { x: -2, y: 2 },
        ]}
      />
      <copperpour
        name="POUR_NARROW_NECK"
        connectsTo="net.VCC"
        layer="top"
        clearance="0.2mm"
        outline={[
          { x: -4, y: 4 },
          { x: -2, y: 4 },
          { x: -2, y: 4.85 },
          { x: 2, y: 4.85 },
          { x: 2, y: 4 },
          { x: 4, y: 4 },
          { x: 4, y: 6 },
          { x: 2, y: 6 },
          { x: 2, y: 5.15 },
          { x: -2, y: 5.15 },
          { x: -2, y: 6 },
          { x: -4, y: 6 },
        ]}
      />
      <copperpour
        name="POUR_BOARD_EDGE_CLIP"
        connectsTo="net.EDGE"
        layer="top"
        clearance="0.5mm"
        outline={[
          { x: 7, y: -2 },
          { x: 12, y: -2 },
          { x: 12, y: 2 },
          { x: 7, y: 2 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceNets = circuit.db.source_net.list()
  const gndNetId = sourceNets.find((n) => n.name === "GND")?.source_net_id
  const vccNetId = sourceNets.find((n) => n.name === "VCC")?.source_net_id
  const edgeNetId = sourceNets.find((n) => n.name === "EDGE")?.source_net_id

  const pours = circuit.db.pcb_copper_pour
    .list()
    .filter((pour): pour is PcbCopperPourBRep => pour.shape === "brep")

  const gndPours = pours.filter((p) => p.source_net_id === gndNetId)
  expect(gndPours).toHaveLength(1)
  const gndXs = gndPours[0]!.brep_shape.outer_ring.vertices.map((v) => v.x)
  const gndYs = gndPours[0]!.brep_shape.outer_ring.vertices.map((v) => v.y)
  expect(Math.min(...gndXs)).toBeCloseTo(-2, 5)
  expect(Math.max(...gndXs)).toBeCloseTo(2, 5)
  expect(Math.min(...gndYs)).toBeCloseTo(-2, 5)
  expect(Math.max(...gndYs)).toBeCloseTo(2, 5)

  const vccPours = pours.filter((p) => p.source_net_id === vccNetId)
  expect(vccPours).toHaveLength(1)
  const vccXs = vccPours[0]!.brep_shape.outer_ring.vertices.map((v) => v.x)
  expect(Math.min(...vccXs)).toBeCloseTo(-4, 5)
  expect(Math.max(...vccXs)).toBeCloseTo(4, 5)

  const edgePours = pours.filter((p) => p.source_net_id === edgeNetId)
  expect(edgePours).toHaveLength(1)
  const edgeXs = edgePours[0]!.brep_shape.outer_ring.vertices.map((v) => v.x)
  const edgeYs = edgePours[0]!.brep_shape.outer_ring.vertices.map((v) => v.y)
  expect(Math.min(...edgeXs)).toBeCloseTo(7, 5)
  expect(Math.max(...edgeXs)).toBeCloseTo(9.5, 5)
  expect(Math.min(...edgeYs)).toBeCloseTo(-2, 5)
  expect(Math.max(...edgeYs)).toBeCloseTo(2, 5)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
