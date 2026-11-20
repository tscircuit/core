import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/core/issues/5506
// An explicit copperpour outline should not be inset by boardEdgeMargin
// (which defaults to clearance) when it is far from the board edge.

test("repro5506: copperpour outline far from board edge is inset by clearance", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <net name="GND" />
      <copperpour
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
    </board>,
  )

  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list() as PcbCopperPourBRep[]
  expect(pours).toHaveLength(1)
  const xs = pours[0]!.brep_shape.outer_ring.vertices.map((point) => point.x)
  // BUG: the 4x4mm outline comes out as a 3x3mm pour
  expect(Math.min(...xs)).toBe(-1.5)
  expect(Math.max(...xs)).toBe(1.5)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
