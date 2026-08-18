import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  assertComponentsSpanInsideAndOutsideOutline,
  assertViaStitchingInsideOutline,
  assertViaStitchingOutput,
} from "./assert-via-stitching-output"
import {
  concavePolygonCopperPourOutline,
  ViaStitchingConcavePolygonCircuit,
} from "./via-stitching-test-circuits"

test("via stitching stays inside a partial-board concave GND-pour polygon", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaStitchingConcavePolygonCircuit />)

  await circuit.renderUntilSettled()

  assertViaStitchingOutput({ circuit })
  assertViaStitchingInsideOutline({
    circuit,
    outline: concavePolygonCopperPourOutline,
  })
  assertComponentsSpanInsideAndOutsideOutline({
    circuit,
    outline: concavePolygonCopperPourOutline,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
