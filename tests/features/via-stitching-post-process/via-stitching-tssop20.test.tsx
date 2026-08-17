import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertViaStitchingOutput } from "./assert-via-stitching-output"
import { ViaStitchingTssop20Circuit } from "./via-stitching-test-circuits"

test("via stitching connects TSSOP-20 top and bottom GND pours", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaStitchingTssop20Circuit />)

  await circuit.renderUntilSettled()

  assertViaStitchingOutput({ circuit })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
