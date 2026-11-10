import { expect } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"

/** Measure final emitted planar copper by exact source ownership. */
export function expectDifferentialPairLengths(circuit: RootCircuit) {
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_bus_length_skew_error.list()).toEqual([])
  for (const pair of circuit.db.source_bus.list()) {
    if (!pair.differential_pair) continue
    const lengths = [
      pair.differential_pair.positive_source_trace_ids,
      pair.differential_pair.negative_source_trace_ids,
    ].map((ids) =>
      ids.reduce((total, id) => {
        const copper = circuit.db.pcb_trace
          .list()
          .filter((trace) => trace.source_trace_id === id)
        expect(copper.length).toBeGreaterThan(0)
        return (
          total +
          copper.reduce(
            (sum, trace) =>
              sum +
              trace.route
                .flatMap((point) =>
                  point.route_type === "through_pad"
                    ? [point.start, point.end]
                    : [point],
                )
                .reduce((length, point, index, points) => {
                  const previous = points[index - 1]
                  return previous
                    ? length +
                        Math.hypot(point.x - previous.x, point.y - previous.y)
                    : length
                }, 0),
            0,
          )
        )
      }, 0),
    )
    expect(Math.abs(lengths[0]! - lengths[1]!)).toBeLessThanOrEqual(
      pair.max_length_skew + 1e-9,
    )
  }
}
