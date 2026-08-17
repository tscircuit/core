import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertViaStitchingOutput } from "./assert-via-stitching-output"
import { ViaStitchingQfn32Circuit } from "./via-stitching-test-circuits"

test("via stitching post-process reinforces a QFN-32 power transition", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaStitchingQfn32Circuit />)

  await circuit.renderUntilSettled()

  assertViaStitchingOutput({ circuit })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 0.5,
  })
})
