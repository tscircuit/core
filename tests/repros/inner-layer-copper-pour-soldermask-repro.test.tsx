import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// circuit-json-to-gerber#127: soldermask only exists on the top and bottom
// layers. A top pour with coveredWithSolderMask false gets a soldermask
// opening, but an inner-layer pour has no soldermask to open, so it must stay
// covered_with_solder_mask true. Gerber export throws on an inner false.
test("only outer-layer copper pours request a soldermask opening", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} layers={4} routingDisabled>
      <copperpour
        layer="top"
        connectsTo="net.GND"
        coveredWithSolderMask={false}
      />
      <copperpour
        layer="inner1"
        connectsTo="net.GND"
        coveredWithSolderMask={false}
      />
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
        "covered_with_solder_mask": false,
        "layer": "top",
      },
      {
        "covered_with_solder_mask": true,
        "layer": "inner1",
      },
    ]
  `)
})
