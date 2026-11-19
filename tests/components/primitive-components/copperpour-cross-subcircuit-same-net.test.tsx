import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connected same-net pours in different subcircuits are not pushed apart", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <net name="GND" />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: -4, y: -2 },
          { x: 0.5, y: -2 },
          { x: 0.5, y: 2 },
          { x: -4, y: 2 },
        ]}
      />
      <subcircuit name="child" routingDisabled exposedNets={["GND"]}>
        <net name="GND" />
        <copperpour
          connectsTo="net.GND"
          layer="top"
          outline={[
            { x: -0.5, y: -2 },
            { x: 4, y: -2 },
            { x: 4, y: 2 },
            { x: -0.5, y: 2 },
          ]}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const xs = (circuit.db.pcb_copper_pour.list() as PcbCopperPourBRep[]).map(
    (pour) => pour.brep_shape.outer_ring.vertices.map((point) => point.x),
  )
  expect(xs).toHaveLength(2)
  // The pours still overlap, so the copper stays connected
  expect(Math.max(...xs[0]!)).toBeGreaterThan(Math.min(...xs[1]!))
})
