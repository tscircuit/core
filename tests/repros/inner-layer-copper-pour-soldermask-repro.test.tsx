import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Soldermask only exists on the top and bottom layers. Outer-layer pours may
// be covered or not, but an inner-layer pour has no soldermask, so it must
// always be covered_with_solder_mask false, even when coveredWithSolderMask
// is set (circuit-json-to-gerber#127).
test("inner-layer copper pours are never covered with soldermask", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} layers={4} routingDisabled>
      <copperpour layer="top" connectsTo="net.GND" />
      <copperpour layer="inner1" connectsTo="net.GND" coveredWithSolderMask />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(
    circuit.db.pcb_copper_pour
      .list()
      .map(({ layer, covered_with_solder_mask }) => ({
        layer,
        covered_with_solder_mask,
      })),
  ).toMatchInlineSnapshot(`
    [
      {
        "covered_with_solder_mask": true,
        "layer": "top",
      },
      {
        "covered_with_solder_mask": false,
        "layer": "inner1",
      },
    ]
  `)
})
