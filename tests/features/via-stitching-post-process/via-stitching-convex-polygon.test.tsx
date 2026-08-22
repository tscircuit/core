import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  assertComponentsSpanInsideAndOutsideOutline,
  assertViaStitchingInsideOutline,
  assertViaStitchingOutput,
} from "./assert-via-stitching-output"
import {
  convexPolygonCopperPourOutline,
  ViaStitchingConvexPolygonCircuit,
} from "./via-stitching-test-circuits"

test("via stitching stays inside a partial-board convex GND-pour polygon", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaStitchingConvexPolygonCircuit />)

  await circuit.renderUntilSettled()

  assertViaStitchingOutput({ circuit })
  assertViaStitchingInsideOutline({
    circuit,
    outline: convexPolygonCopperPourOutline,
  })
  assertComponentsSpanInsideAndOutsideOutline({
    circuit,
    outline: convexPolygonCopperPourOutline,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
