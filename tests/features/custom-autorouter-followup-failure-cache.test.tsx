import "../fixtures/extend-expect-circuit-snapshot"
import { expect, test } from "bun:test"
import { getCustomCachedFollowupFixture } from "../fixtures/get-custom-cached-followup-fixture"
test("a failed follow-up retains the accepted custom prefix in the native cache", async () => {
  const fixture = getCustomCachedFollowupFixture(true),
    failed = await fixture.render(),
    recovered = await fixture.render()
  expect(failed.followUpCalls).toBe(1)
  expect(failed.rows.some((row) => row.type === "pcb_autorouting_error")).toBe(
    true,
  )
  expect(recovered.firstStageCalls).toBe(1)
  expect(recovered.followUpCalls).toBe(2)
  expect(recovered.starts[0]?.cacheStatus).toBe("hit")
  expect(recovered.ends).toHaveLength(2)
  expect(recovered.rows.filter((row) => row.type.endsWith("_error"))).toEqual(
    [],
  )
  expect(recovered.firstStageTraces).toEqual(failed.firstStageTraces)
  await expect(recovered.circuit).toMatchPcbSnapshot(import.meta.path)
})
