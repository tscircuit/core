import { expect, test } from "bun:test"
import { assertViaStitchingOutput } from "tests/fixtures/via-stitching/assert-via-stitching-output"
import { getViaStitchingTestFixture } from "tests/fixtures/via-stitching/get-via-stitching-test-fixture"
import { ViaStitchingSoic8Circuit } from "tests/fixtures/via-stitching/via-stitching-test-circuits"

test("via stitching post-process reinforces an SOIC-8 power transition", async () => {
  const { circuit, runViaStitchingPostProcessSolverStep } =
    getViaStitchingTestFixture()
  circuit.add(<ViaStitchingSoic8Circuit />)

  const output = await runViaStitchingPostProcessSolverStep()

  assertViaStitchingOutput({ circuit, output })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 0.5,
  })
})
