import { beforeAll, expect, test } from "bun:test"
import {
  addSavedRouteBranchStatus,
  getSavedRouteBranchCopper,
  getSavedRouteBranchesFixture,
} from "tests/fixtures/get-saved-route-branches-fixture"

const fixture = getSavedRouteBranchesFixture({ kind: "spanning_connections" })

beforeAll(async () => {
  await fixture.circuit.renderUntilSettled()
  expect(fixture.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(getSavedRouteBranchCopper(fixture.circuit)).toEqual(fixture.routes)
  const event = fixture.events[0]!
  expect(event.pcbTracePaths).toHaveLength(2)
  expect(event.pcbTracePathsUnavailableReason).toBeUndefined()
  addSavedRouteBranchStatus(
    fixture.circuit,
    `Save: ${event.pcbTracePathsUnavailableReason ? "BLOCKED" : "OK"} (${event.pcbTracePaths?.length ?? 0} / 2 paths)`,
  )
  await expect(fixture.circuit).toMatchPcbSnapshot(import.meta.path)
})

test("saved routes preserve a net routed across separate connection requests", async () => {
  const event = fixture.events[0]!
  expect(event.pcbTracePathsUnavailableReason).toBeUndefined()
  expect(event.pcbTracePaths).toHaveLength(2)
  const replay = getSavedRouteBranchesFixture({
    kind: "spanning_connections",
    paths: JSON.parse(JSON.stringify(event.pcbTracePaths)),
  })
  await replay.circuit.renderUntilSettled()
  expect(replay.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(getSavedRouteBranchCopper(replay.circuit)).toEqual(fixture.routes)
  const replayEvent = replay.events[0]!
  addSavedRouteBranchStatus(
    replay.circuit,
    `Save: ${replayEvent.pcbTracePathsUnavailableReason ? "BLOCKED" : "OK"} (${replayEvent.pcbTracePaths?.length ?? 0} / 2 paths)`,
  )
  await expect(replay.circuit).toMatchPcbSnapshot(import.meta.path)
})
