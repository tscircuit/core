import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertViaStitchingOutput } from "./assert-via-stitching-output"
import { ViaStitchingQfp16Circuit } from "./via-stitching-test-circuits"

test("via stitching connects QFP-16 top and bottom GND pours", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaStitchingQfp16Circuit />)

  await circuit.renderUntilSettled()

  assertViaStitchingOutput({ circuit })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
