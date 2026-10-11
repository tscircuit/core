import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MatchedBusPhaseSplitFixture } from "./fixtures/matched-bus-phase-split.fixture"

test("a complete matched bus still routes together with its declared skew", async () => {
  const { circuit } = getTestFixture()
  const phaseConnectionCounts: number[] = []
  circuit.on("autorouting:start", (event) => {
    phaseConnectionCounts.push(event.simpleRouteJson.connections.length)
  })
  circuit.add(<MatchedBusPhaseSplitFixture routeTogether />)
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  const pcbTraces = json.filter((record) => record.type === "pcb_trace")
  expect(phaseConnectionCounts).toEqual([2])
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
  expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
    0.1 + 1e-7,
  )
  expect(json.filter((record) => record.type.endsWith("_error"))).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
