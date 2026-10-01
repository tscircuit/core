import { expect, mock, test } from "bun:test"
import {
  getPlanarRouteLength,
  renderAm62lLpddr4Fanout,
} from "tests/fixtures/create-am62l-lpddr4-fanout"
import { solveAm62lByteBusBreakoutPoints } from "tests/fixtures/solve-am62l-byte-bus-breakout-points"
import { createBgaFanoutAlgorithm } from "tests/fixtures/create-bga-fanout-algorithm"

test("routes two DDR byte buses with bga-fanout-solver", async () => {
  const fanoutAlgorithmFn = mock(createBgaFanoutAlgorithm)
  const circuit = await renderAm62lLpddr4Fanout({
    fanoutAlgorithmFn,
    implicitBreakoutPointSolverFn: solveAm62lByteBusBreakoutPoints,
    // Keep dense BGA escapes on separate routing layers.
    signalOnlyBoardLayerCount: 8,
    snapshotPath: import.meta.path,
  })
  expect(fanoutAlgorithmFn).toHaveBeenCalledTimes(2)
  const fanoutLengths = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.route.some((point) => point.route_type === "via"))
    .map((trace) => getPlanarRouteLength(trace.route))
  // Bound emitted copper length so centralized exits cannot reintroduce the
  // long hairpins even if their routing is electrically complete.
  expect(Math.max(...fanoutLengths)).toBeLessThan(15.5)
  expect(fanoutLengths.reduce((sum, length) => sum + length, 0)).toBeLessThan(
    330,
  )
}, 300_000)
