import { expect, test } from "bun:test"
import type { SimpleRouteBus } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MatchedBusPhaseSplitFixture } from "./fixtures/matched-bus-phase-split.fixture"

// Enable the intended assertion directly with TSCIRCUIT_ENABLE_SPLIT_BUS_REPRO=1.
const regressionTest = process.env.TSCIRCUIT_ENABLE_SPLIT_BUS_REPRO
  ? test
  : test.failing

regressionTest(
  "a length-matched bus must not silently become independent phase singletons",
  async () => {
    const { circuit } = getTestFixture()
    const phaseMemberCounts: number[][] = []
    const routingMessages: string[] = []
    circuit.on("autorouting:start", (event) => {
      phaseMemberCounts.push(
        (event.simpleRouteJson?.buses ?? []).map(
          (bus: SimpleRouteBus) => bus.connectionNames.length,
        ),
      )
    })
    circuit.on("autorouting:error", (event) => {
      routingMessages.push(event.error.message)
    })
    circuit.add(<MatchedBusPhaseSplitFixture />)
    await circuit.renderUntilSettled()

    const json = circuit.getCircuitJson()
    const pcbTraces = json.filter((record) => record.type === "pcb_trace")
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    if (pcbTraces.length > 0) {
      // Main routes both singleton phases to 20mm/16mm, violating the bus's
      // authored 0.1mm limit. This is the concrete native failing assertion.
      expect(pcbTraces).toHaveLength(2)
      expect(phaseMemberCounts).toEqual([[1], [1]])
      const lengths = pcbTraces.map((pcbTrace) =>
        pcbTrace.route.slice(1).reduce((length, point, routeIndex) => {
          const previous = pcbTrace.route[routeIndex]
          if (point.route_type !== "wire" || previous.route_type !== "wire") {
            throw new Error("This fixture must produce planar wire-only routes")
          }
          return length + Math.hypot(point.x - previous.x, point.y - previous.y)
        }, 0),
      )
      expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
        0.1 + 1e-7,
      )
    }

    // Reject unsupported cross-phase matching before any solver starts and
    // expose the declared bus name through the normal routing diagnostics.
    expect(phaseMemberCounts).toEqual([])
    expect(pcbTraces).toHaveLength(0)
    const routingErrors = json.filter(
      (record) => record.type === "pcb_autorouting_error",
    )
    expect(routingErrors).toHaveLength(1)
    expect(routingErrors[0].message).toBe(
      'Length-matched bus "DATA" cannot be split across autorouting phases. Assign the complete bus to one routingPhaseIndex.',
    )
    expect(routingMessages).toEqual([routingErrors[0].message])
    expect(routingErrors[0].message).not.toMatch(/source_|pcb_|subcircuit_/)
  },
)
