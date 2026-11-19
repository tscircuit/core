import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { CopperPour } from "lib/components/primitive-components/CopperPour/CopperPour"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a copper pour added after the first render keeps its clearance from existing pours", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <net name="GND" />
      <net name="VCC" />
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
    </board>,
  )
  await circuit.renderUntilSettled()

  circuit.children[0]!.add(
    new CopperPour({
      connectsTo: "net.VCC",
      layer: "top",
      outline: [
        { x: -0.5, y: -2 },
        { x: 4, y: -2 },
        { x: 4, y: 2 },
        { x: -0.5, y: 2 },
      ],
    }),
  )
  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list() as PcbCopperPourBRep[]
  const getXs = (netName: string) =>
    pours
      .filter(
        (pour) =>
          circuit.db.source_net.get(pour.source_net_id!)?.name === netName,
      )
      .flatMap((pour) => pour.brep_shape.outer_ring.vertices.map((p) => p.x))

  // The existing GND pour is not inserted a second time
  expect(pours).toHaveLength(2)
  // The late VCC pour gives way to the GND copper already on the board
  expect(Math.min(...getXs("VCC")) - Math.max(...getXs("GND"))).toBeCloseTo(
    0.2,
    3,
  )
})
