import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic copper pour bounds follow an offset board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" boardAnchorPosition={{ x: 20, y: 10 }}>
      <net name="GND" />
      <copperpour connectsTo="net.GND" layer="top" boardEdgeMargin="1mm" />
      <pcbnotetext
        text="Pour should follow board centered at (20, 10)"
        pcbX={20}
        pcbY={10}
        fontSize="0.6mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pourVertices = circuit.db.pcb_copper_pour
    .list()
    .filter(
      (copperPour): copperPour is PcbCopperPourBRep =>
        copperPour.shape === "brep",
    )
    .flatMap((copperPour) => copperPour.brep_shape.outer_ring.vertices)

  expect(Math.min(...pourVertices.map((point) => point.x))).toBe(11)
  expect(Math.max(...pourVertices.map((point) => point.x))).toBe(29)
  expect(Math.min(...pourVertices.map((point) => point.y))).toBe(6)
  expect(Math.max(...pourVertices.map((point) => point.y))).toBe(14)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
