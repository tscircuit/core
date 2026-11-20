import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { expect, test } from "bun:test"
import { checkPcbBusLengthSkew } from "@tscircuit/checks"
import {
  DETOUR_EXTRA_LENGTH,
  renderDifferentialPairBoard,
} from "tests/fixtures/local-skew/differential-pair-board"

test("end-to-end skew flags the same pair without the compensating detour", async () => {
  const circuitJson = renderDifferentialPairBoard({ compensated: false })

  const errors = checkPcbBusLengthSkew(circuitJson)

  // Control for the mid-route test: the check does run on this board.
  expect(errors).toHaveLength(1)
  expect(errors[0].actual_length_skew).toBeCloseTo(DETOUR_EXTRA_LENGTH, 6)
  expect(errors[0].maximum_length_skew).toBe(0.1)
  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
