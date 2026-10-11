import { expect, test } from "bun:test"
import type { SimpleRouteBus } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MatchedBusPhaseSplitFixture } from "./fixtures/matched-bus-phase-split.fixture"

test("an unconstrained bus can still be split into independent phases", async () => {
  const { circuit } = getTestFixture()
  const phaseMemberCounts: number[][] = []
  circuit.on("autorouting:start", (event) => {
    phaseMemberCounts.push(
      (event.simpleRouteJson.buses ?? []).map(
        (bus: SimpleRouteBus) => bus.connectionNames.length,
      ),
    )
  })
  circuit.add(<MatchedBusPhaseSplitFixture constrainLength={false} />)
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  const pcbTraces = json.filter((record) => record.type === "pcb_trace")
  expect(phaseMemberCounts).toEqual([[1], [1]])
  expect(pcbTraces).toHaveLength(2)
  const lengths = pcbTraces.map((pcbTrace) =>
    pcbTrace.route.slice(1).reduce((length, point, routeIndex) => {
      const previous = pcbTrace.route[routeIndex]
      if (point.route_type !== "wire" || previous.route_type !== "wire") {
        throw new Error("This fixture must produce planar wire-only routes")
      }
      return length + Math.hypot(point.x - previous.x, point.y - previous.y)
    }, 0),
  )
  expect(lengths.sort((a, b) => a - b)).toEqual([16, 20])
  expect(json.filter((record) => record.type.endsWith("_error"))).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
