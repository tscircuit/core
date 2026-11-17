import { expect, test } from "bun:test"
import "tests/fixtures/extend-expect-any-svg"
import {
  getFixedViaPhysicalSpanFixture,
  observeFixedViaPhysicalSpans,
} from "tests/fixtures/fixed-via-physical-span"
import { getFixedViaPhysicalSpanSnapshot } from "tests/fixtures/fixed-via-physical-span-snapshot"

test("preserve four-layer existing via spans at Core's bus handoff", async () => {
  const fixture = getFixedViaPhysicalSpanFixture()
  const original = structuredClone(fixture)
  const observed = observeFixedViaPhysicalSpans(fixture)
  expect(observed.rows.map((row) => row.exportedLayers)).toEqual([
    ["top", "inner1", "inner2", "bottom"],
    ["top", "inner1"],
    ["top", "inner1", "inner2", "bottom"],
    ["top", "inner1"],
  ])
  expect(
    observed.recovered.obstacles.filter(
      (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id,
    ),
  ).toHaveLength(0)
  expect(fixture).toEqual(original)
  const svg = getFixedViaPhysicalSpanSnapshot({
    circuitJson: fixture.circuitJson,
    rows: observed.rows,
  })
  await expect(svg).toMatchSvgSnapshot(
    import.meta.path,
    "fixed-via-physical-span",
    {
      diffThresholdPercent: 0,
    },
  )
})
