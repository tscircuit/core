import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fiducial soldermask coverage with configured pullback", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={8}>
      <fiducial name="FID1" padDiameter={1} soldermaskPullback={1} />
      <pcbnotetext text="FID1" pcbY={2} fontSize={0.7} />
      <pcbnotetext
        text="MASK COVERAGE: SEE CIRCUIT JSON"
        pcbY={-2}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const [fiducialPad] = circuit.db.pcb_smtpad.list()
  expect({
    is_covered_with_solder_mask: fiducialPad.is_covered_with_solder_mask,
    soldermask_margin: fiducialPad.soldermask_margin,
  }).toMatchInlineSnapshot(`
    {
      "is_covered_with_solder_mask": true,
      "soldermask_margin": 1,
    }
  `)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: false,
  })
})
