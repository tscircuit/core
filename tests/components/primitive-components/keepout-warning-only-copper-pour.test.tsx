import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import KeepoutWarningOnlyCopperPourExample from "tests/examples/keepout-warning-only-copper-pour"

test("copper fills advisory keepouts and is clipped around enforcing keepouts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<KeepoutWarningOnlyCopperPourExample />)
  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours).toHaveLength(2)
  expect(
    pours.map((pour) => {
      if (pour.shape !== "brep") throw new Error("Expected BRep copper pour")
      return pour.brep_shape.inner_rings.length
    }),
  ).toEqual([0, 1])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "top",
    width: 1200,
    height: 700,
  })
})
