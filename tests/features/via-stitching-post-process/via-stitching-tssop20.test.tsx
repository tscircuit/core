import { expect, test } from "bun:test"
import { assertViaStitchingOutput } from "tests/fixtures/via-stitching/assert-via-stitching-output"
import { getViaStitchingTestFixture } from "tests/fixtures/via-stitching/get-via-stitching-test-fixture"
import { ViaStitchingTssop20Circuit } from "tests/fixtures/via-stitching/via-stitching-test-circuits"

test("via stitching post-process reinforces a TSSOP-20 power transition", async () => {
  const { circuit, runViaStitchingPostProcessSolverStep } =
    getViaStitchingTestFixture()
  circuit.add(<ViaStitchingTssop20Circuit />)

  const output = await runViaStitchingPostProcessSolverStep()

  assertViaStitchingOutput({ circuit, output })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
