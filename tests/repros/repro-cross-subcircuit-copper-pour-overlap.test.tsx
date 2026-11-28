import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Pours are solved one subcircuit at a time, and a subcircuit's pours are not
// cleared against pours already placed by another subcircuit. Here a GND pour
// on the board and a VCC pour in a child subcircuit have outlines that overlap
// by 1mm, so their copper overlaps (a GND/VCC short) with no error.

test("different-net copper pours in different subcircuits overlap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <net name="GND" />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        clearance="0.2mm"
        outline={[
          { x: -4, y: -2 },
          { x: 0.5, y: -2 },
          { x: 0.5, y: 2 },
          { x: -4, y: 2 },
        ]}
      />
      <subcircuit name="child" routingDisabled>
        <net name="VCC" />
        <copperpour
          connectsTo="net.VCC"
          layer="top"
          clearance="0.2mm"
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

  const getPourXs = (netName: string) => {
    const net = circuit.db.source_net.list().find((n) => n.name === netName)!
    return (circuit.db.pcb_copper_pour.list() as PcbCopperPourBRep[])
      .filter((pour) => pour.source_net_id === net.source_net_id)
      .flatMap((pour) => pour.brep_shape.outer_ring.vertices.map((p) => p.x))
  }
  const gndRight = Math.max(...getPourXs("GND"))
  const vccLeft = Math.min(...getPourXs("VCC"))

  // BUG: the GND copper extends past the start of the VCC copper
  expect(gndRight).toBeGreaterThan(vccLeft)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
