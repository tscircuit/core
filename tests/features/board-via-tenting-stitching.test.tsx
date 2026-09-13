import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board tenting false overrides the stitching solver's tented default", async () => {
  const { circuit } = getTestFixture()
  circuit._featurePcbViaStitching = true
  circuit.add(
    <board width={6} height={6} defaultViaTenting={false}>
      <pcbnotetext text="Stitching vias exposed" pcbY={2.5} fontSize={0.35} />
      <net name="GND" />
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.GND" layer="bottom" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)
  expect(
    vias.every(
      (via) => via.tented_on_top === false && via.tented_on_bottom === false,
    ),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    layer: "top",
  })
})
