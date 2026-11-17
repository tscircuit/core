import { beforeAll, expect, test } from "bun:test"
import {
  getSavedRouteBranchCopper,
  getSavedRouteBranchesFixture,
} from "tests/fixtures/get-saved-route-branches-fixture"

const fixture = getSavedRouteBranchesFixture({ kind: "junction" })

beforeAll(async () => {
  await fixture.circuit.renderUntilSettled()
  expect(fixture.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(getSavedRouteBranchCopper(fixture.circuit)).toEqual(fixture.routes)
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
    await expect(replay.circuit).toMatchPcbSnapshot(import.meta.path)
  },
)
