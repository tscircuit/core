import { beforeAll, expect, test } from "bun:test"
import {
  addSavedRouteBranchStatus,
  getSavedRouteBranchCopper,
  getSavedRouteBranchesFixture,
} from "tests/fixtures/get-saved-route-branches-fixture"

const fixture = getSavedRouteBranchesFixture({ kind: "junction" })

beforeAll(async () => {
  await fixture.circuit.renderUntilSettled()
  expect(fixture.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(getSavedRouteBranchCopper(fixture.circuit)).toEqual(fixture.routes)
  const event = fixture.events[0]!
  expect(event.pcbTracePaths).toBeUndefined()
  expect(event.pcbTracePathsUnavailableReason).toBe(
    "Routes contain a junction or endpoint that cannot select a unique PCB port",
  )
  addSavedRouteBranchStatus(fixture.circuit, {
    operation: "save",
    actualCount: event.pcbTracePaths?.length ?? 0,
    expectedCount: 4,
    error: event.pcbTracePathsUnavailableReason,
  })
  // Snapshot errors must fail CI, independently of the expected export failure.
  await expect(fixture.circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing(
  "saved routes round-trip junctions and a trunk without a pad endpoint",
  async () => {
    const event = fixture.events[0]!
    expect(event.pcbTracePathsUnavailableReason).toBeUndefined()
    expect(event.pcbTracePaths).toHaveLength(4)
    const replay = getSavedRouteBranchesFixture({
      kind: "junction",
      paths: JSON.parse(JSON.stringify(event.pcbTracePaths)),
    })
    await replay.circuit.renderUntilSettled()
    expect(replay.circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(getSavedRouteBranchCopper(replay.circuit)).toEqual(fixture.routes)
    const replayEvent = replay.events[0]!
    addSavedRouteBranchStatus(replay.circuit, {
      operation: "save",
      actualCount: replayEvent.pcbTracePaths?.length ?? 0,
      expectedCount: 4,
      error: replayEvent.pcbTracePathsUnavailableReason,
    })
    await expect(replay.circuit).toMatchPcbSnapshot(import.meta.path)
  },
)
