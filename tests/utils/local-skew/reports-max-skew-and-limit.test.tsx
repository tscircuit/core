import { expect, test } from "bun:test"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import {
  DETOUR_EXTRA_LENGTH,
  renderDifferentialPairBoard,
} from "tests/fixtures/local-skew/differential-pair-board"

test("reports the pair's largest local skew and its maxLengthSkew", async () => {
  const circuitJson = renderDifferentialPairBoard({ compensated: true })
  const pairs = getStoredLocalSkew(circuitJson)

  expect(pairs).toHaveLength(1)
  const bus = circuitJson.find((element) => element.type === "source_bus")
  if (!bus) throw new Error("Expected the USB bus")
  expect(pairs[0].source_bus_id).toBe(bus.source_bus_id)
  expect(pairs[0].subcircuit_id).toBe(bus?.subcircuit_id)
  expect(pairs[0].max_local_skew).toBeCloseTo(DETOUR_EXTRA_LENGTH, 5)
  expect(pairs[0].max_length_skew).toBe(0.1)

  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
