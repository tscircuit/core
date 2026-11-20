import { expect, test } from "bun:test"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { renderPairBoard } from "tests/fixtures/local-skew/pair-board"

test("a differential pair with only one routed trace has no local skew element", async () => {
  const circuitJson = renderPairBoard({ positivePath: [] })
  expect(
    circuitJson.filter((element) => element.type === "pcb_trace"),
  ).toHaveLength(1)
  expect(getStoredLocalSkew(circuitJson)).toEqual([])
  expect(
    circuitJson.filter((element) => element.type === "source_runtime_error"),
  ).toEqual([])
  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
