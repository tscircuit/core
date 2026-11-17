import { beforeAll, expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import {
  addSavedRouteBranchStatus,
  getSavedRouteBranchCopper,
  getSavedRouteBranchesFixture,
} from "tests/fixtures/get-saved-route-branches-fixture"

const fixture = getSavedRouteBranchesFixture({ kind: "shared_pad" })
let replay: ReturnType<typeof getSavedRouteBranchesFixture>

beforeAll(async () => {
  await fixture.circuit.renderUntilSettled()
  expect(fixture.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(getSavedRouteBranchCopper(fixture.circuit)).toEqual(fixture.routes)
  const paths: FanoutTracePath[] = getSavedRouteBranchCopper(
    fixture.circuit,
  ).map((route) => ({ connection: "A.1", route }))
  const original = JSON.stringify(paths)
  replay = getSavedRouteBranchesFixture({ kind: "shared_pad", paths })
  await replay.circuit.renderUntilSettled()
  expect(JSON.stringify(paths)).toBe(original)
  const errors = replay.circuit.db.pcb_autorouting_error.list()
  expect(errors.map((error) => error.message)).toEqual([
    'Saved phase path "A.1" must select exactly one connection in this phase',
  ])
  expect(replay.circuit.db.pcb_trace.list()).toHaveLength(0)
  addSavedRouteBranchStatus(
    replay.circuit,
    `Replay: ${errors.length ? "BLOCKED" : "OK"} (${replay.circuit.db.pcb_trace.list().length} / 2 traces)`,
  )
  // A failed replay has pads but no copper. Keep its visual check outside test.failing.
  await expect(replay.circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing(
  "two saved paths may start at the same pad across same-net connections",
  async () => {
    expect(replay.circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(getSavedRouteBranchCopper(replay.circuit)).toEqual(fixture.routes)
  },
)
