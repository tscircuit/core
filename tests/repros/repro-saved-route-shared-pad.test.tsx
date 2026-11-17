import { beforeAll, expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import {
  getSavedRouteBranchCopper,
  getSavedRouteBranchesFixture,
} from "tests/fixtures/get-saved-route-branches-fixture"

const fixture = getSavedRouteBranchesFixture({ kind: "shared_pad" })

beforeAll(async () => {
  await fixture.circuit.renderUntilSettled()
  expect(fixture.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(getSavedRouteBranchCopper(fixture.circuit)).toEqual(fixture.routes)
  await expect(fixture.circuit).toMatchPcbSnapshot(import.meta.path)
})

test("two saved paths may start at the same pad across same-net connections", async () => {
  const paths: FanoutTracePath[] = getSavedRouteBranchCopper(
    fixture.circuit,
  ).map((route) => ({
    connection: "A.1",
    route,
  }))
  const original = JSON.stringify(paths)
  const replay = getSavedRouteBranchesFixture({ kind: "shared_pad", paths })
  await replay.circuit.renderUntilSettled()
  expect(replay.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(getSavedRouteBranchCopper(replay.circuit)).toEqual(fixture.routes)
  expect(JSON.stringify(paths)).toBe(original)
  await expect(replay.circuit).toMatchPcbSnapshot(import.meta.path)
})
