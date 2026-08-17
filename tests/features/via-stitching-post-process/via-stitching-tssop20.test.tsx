import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertViaStitchingOutput } from "./assert-via-stitching-output"
import { ViaStitchingTssop20Circuit } from "./via-stitching-test-circuits"

test("via stitching post-process reinforces a TSSOP-20 power transition", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaStitchingTssop20Circuit />)

  await circuit.renderUntilSettled()

  assertViaStitchingOutput({ circuit })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
