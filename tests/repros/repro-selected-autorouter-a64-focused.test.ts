import { beforeAll, expect, test } from "bun:test"
import "../fixtures/extend-expect-any-svg"
import {
  getDrillPadOverlaps,
  type A64DrillOverlap,
} from "../fixtures/a64-selected-autorouter/get-drill-pad-overlaps"
import { getA64RepairSvg } from "../fixtures/a64-selected-autorouter/get-a64-repair-svg"
import {
  getFocusedA64RepairCheckpoint,
  repairSelectedA64,
} from "../fixtures/a64-selected-autorouter/repair-selected-a64"

let overlaps: A64DrillOverlap[]

beforeAll(async () => {
  const checkpoint = getFocusedA64RepairCheckpoint()
  const original = structuredClone(checkpoint)
  const repair = repairSelectedA64(checkpoint)
  expect(repair.failed, repair.error ?? "").toBe(false)
  expect(repair.solved).toBe(true)
  expect(checkpoint).toEqual(original)
  expect(repair.getOutput()).toHaveLength(1)
  expect(repair.getOutput()[0]!.route[0]).toEqual(
    checkpoint.newHdRoutes[0]!.route[0],
  )
  expect(repair.getOutput()[0]!.route.at(-1)).toEqual(
    checkpoint.newHdRoutes[0]!.route.at(-1),
  )
  overlaps = getDrillPadOverlaps({
    input: checkpoint.originalSrj,
    routes: repair.getOutput(),
  })
  await expect(
    getA64RepairSvg({
      input: checkpoint.originalSrj,
      routes: repair.getOutput(),
      overlaps,
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})

test("Core's selected autorouter repairs the imported A64 drill crossing a foreign pad", () => {
  expect(overlaps).toHaveLength(0)
})
