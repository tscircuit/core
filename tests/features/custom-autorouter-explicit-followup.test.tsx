import "../fixtures/extend-expect-circuit-snapshot"
import { expect, test } from "bun:test"
import { getCustomCachedFollowupFixture } from "../fixtures/get-custom-cached-followup-fixture"
test("an opted-in cached custom router runs its native follow-up without repeating the prefix", async () => {
  const fixture = getCustomCachedFollowupFixture(),
    first = await fixture.render(),
    second = await fixture.render()
  expect(first.ends).toHaveLength(2)
  expect(second.ends).toHaveLength(2)
  expect(second.firstStageCalls).toBe(1)
  expect(second.followUpCalls).toBe(2)
  expect(second.starts[0]?.cacheStatus).toBe("hit")
  expect(second.rows.filter((row) => row.type === "pcb_trace")).toHaveLength(2)
  expect(second.rows.filter((row) => row.type.endsWith("_error"))).toEqual([])
  expect(second.firstStageTraces).toEqual(first.firstStageTraces)
  await expect(second.circuit).toMatchPcbSnapshot(import.meta.path)
})
