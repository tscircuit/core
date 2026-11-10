import { expect } from "bun:test"
import type { Circuit } from "lib/Circuit"

/** Measure final emitted planar copper by exact source ownership. */
export function expectDifferentialPairLengths(circuit: Circuit) {
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
              trace.route.reduce((length, point, index) => {
                const previous = trace.route[index - 1]
                if (
                  !previous ||
                  point.route_type === "jumper" ||
                  previous.route_type === "jumper"
                )
                  return length
                return (
                  length +
                  Math.hypot(point.x - previous.x, point.y - previous.y)
                )
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
