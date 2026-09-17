import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stitching vias leave tenting unset to inherit the board default", async () => {
  const { circuit } = getTestFixture()
  circuit._featurePcbViaStitching = true
  circuit.add(
    <board width={6} height={6} defaultViaTenting={false} enableViaStitching>
      <pcbnotetext text="Stitching vias exposed" pcbY={2.5} fontSize={0.35} />
      <net name="GND" />
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.GND" layer="bottom" />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    default_via_tented_on_top: false,
    default_via_tented_on_bottom: false,
  })
  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)
  expect(
    vias.every(
      (via) =>
        via.tented_on_top === undefined && via.tented_on_bottom === undefined,
    ),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    layer: "top",
  })
})
