import { beforeAll, expect, test } from "bun:test"
import "../fixtures/extend-expect-any-svg"
import {
  getDrillPadOverlaps,
  type A64DrillOverlap,
} from "../fixtures/a64-selected-autorouter/get-drill-pad-overlaps"
import { getA64RepairSvg } from "../fixtures/a64-selected-autorouter/get-a64-repair-svg"
import {
  loadRealA64RepairCheckpoint,
  repairSelectedA64,
} from "../fixtures/a64-selected-autorouter/repair-selected-a64"

let overlaps: A64DrillOverlap[]

beforeAll(async () => {
  const checkpoint = loadRealA64RepairCheckpoint()
  const original = structuredClone(checkpoint)
  expect(checkpoint.originalSrj.obstacles).toHaveLength(2122)
  expect(checkpoint.originalSrj.connections).toHaveLength(11)
  expect(
    checkpoint.originalSrj.connections.flatMap(
      (connection) => connection.pointsToConnect,
    ),
  ).toHaveLength(22)
  expect(checkpoint.originalSrj.layerCount).toBe(6)
  expect(checkpoint.updatedPreloadedTraces).toHaveLength(0)
  const repair = repairSelectedA64(checkpoint)
  expect(repair.failed, repair.error ?? "").toBe(false)
  expect(repair.solved).toBe(true)
  expect(repair.getOutput()).toHaveLength(11)
  expect(checkpoint).toEqual(original)
  for (const initialRoute of checkpoint.newHdRoutes) {
    const repairedRoute = repair
      .getOutput()
      .find((route) => route.connectionName === initialRoute.connectionName)
    expect(repairedRoute?.route[0]).toEqual(initialRoute.route[0])
    expect(repairedRoute?.route.at(-1)).toEqual(initialRoute.route.at(-1))
  }
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

test.failing(
  "Core's selected autorouter repairs all original A64 byte-zero drill/pad intersections",
  () => {
    expect(overlaps).toHaveLength(0)
  },
)
