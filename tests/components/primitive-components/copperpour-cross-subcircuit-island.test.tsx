import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a child subcircuit's pour inside a board-wide pour of another net is kept", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <net name="GND" />
      <copperpour connectsTo="net.GND" layer="top" />
      <subcircuit name="child" routingDisabled>
        <net name="VCC" />
        <copperpour
          connectsTo="net.VCC"
          layer="top"
          outline={[
            { x: 1, y: -2 },
            { x: 4, y: -2 },
            { x: 4, y: 2 },
            { x: 1, y: 2 },
          ]}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list() as PcbCopperPourBRep[]
  const getNetName = (pour: PcbCopperPourBRep) =>
    circuit.db.source_net.get(pour.source_net_id!)?.name
  const gndPours = pours.filter((pour) => getNetName(pour) === "GND")
  const vccPours = pours.filter((pour) => getNetName(pour) === "VCC")

  expect(vccPours).toHaveLength(1)
  expect(gndPours).toHaveLength(1)
  // The GND plane gets a cutout around the VCC island instead of overlapping it
  expect(gndPours[0]!.brep_shape.inner_rings).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
