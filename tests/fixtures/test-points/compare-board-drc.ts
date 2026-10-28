import {
  runAllRoutingChecks,
  runAllPlacementChecks,
  checkPadPadClearance,
  checkPadTraceClearance,
  checkViaPadClearance,
} from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"

type Finding = { type: string; segment_start?: unknown; segment_end?: unknown }

/** Preserve type, referenced PCB objects, measured geometry and messages.
 * Only diagnostic IDs and segment indexes with explicit endpoint geometry are
 * removed: inserting a vertex shifts indexes without moving an existing defect.
 */
export function getDrcFindingKey(finding: Finding): string {
  const entries = Object.entries(finding).filter(
    ([key]) =>
      key !== `${finding.type}_id` &&
      key !== "pcb_error_id" &&
      !(
        (key === "start_route_index" || key === "end_route_index") &&
        finding.segment_start !== undefined &&
        finding.segment_end !== undefined
      ),
  )
  return JSON.stringify(
    Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b))),
  )
}

export async function compareBoardDrc(
  before: AnyCircuitElement[],
  after: AnyCircuitElement[],
  clearance = 0.2,
) {
  const checks = {
    routing: runAllRoutingChecks,
    placement: runAllPlacementChecks,
    padPad: (board: AnyCircuitElement[]) =>
      checkPadPadClearance(board, { minClearance: clearance }),
    padTrace: (board: AnyCircuitElement[]) =>
      checkPadTraceClearance(board, { minClearance: clearance }),
    viaPad: (board: AnyCircuitElement[]) =>
      checkViaPadClearance(board, { minClearance: clearance }),
  }
  const suites = []
  for (const [name, check] of Object.entries(checks)) {
    const baseline = await check(before)
    const result = await check(after)
    const remaining = new Map<string, number>()
    for (const finding of baseline) {
      const key = getDrcFindingKey(finding)
      remaining.set(key, (remaining.get(key) ?? 0) + 1)
    }
    const added = result.filter((finding) => {
      const key = getDrcFindingKey(finding)
      const count = remaining.get(key) ?? 0
      if (count === 0) return true
      remaining.set(key, count - 1)
      return false
    })
    suites.push({ name, before: baseline.length, after: result.length, added })
  }
  return {
    clearanceMm: clearance,
    suites,
    added: suites.flatMap((suite) => suite.added),
  }
}
