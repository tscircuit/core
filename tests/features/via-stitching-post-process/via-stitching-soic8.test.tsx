import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertViaStitchingOutput } from "./assert-via-stitching-output"
import { ViaStitchingSoic8Circuit } from "./via-stitching-test-circuits"

test("via stitching post-process reinforces an SOIC-8 power transition", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaStitchingSoic8Circuit />)

  await circuit.renderUntilSettled()

  assertViaStitchingOutput({ circuit })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
