import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper pours propagate solder mask coverage", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <net name="GND" />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        coveredWithSolderMask
        name="PourTop"
      />
      <copperpour
        connectsTo="net.GND"
        layer="bottom"
        coveredWithSolderMask
        name="PourBottom"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const copperPours = circuit.db.pcb_copper_pour.list()
  expect(copperPours).toHaveLength(2)
  expect(
    copperPours.every((pour) => pour.covered_with_solder_mask === true),
  ).toBe(true)
})
