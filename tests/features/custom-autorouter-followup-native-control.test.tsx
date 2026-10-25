import { expect, test } from "bun:test"
import "../fixtures/extend-expect-circuit-snapshot"
import { getCustomCachedFollowupFixture } from "../fixtures/get-custom-cached-followup-fixture"
test("native routed control for the cached custom follow-up regression", async () => {
  const state = await getCustomCachedFollowupFixture().render(true)
  expect(state.rows.filter((row) => row.type.endsWith("_error"))).toEqual([])
  await expect(state.circuit).toMatchPcbSnapshot(import.meta.path)
})
