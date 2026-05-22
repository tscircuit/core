import { expect, test } from "bun:test"
import { getSourceTraceIdsFromRerouteName } from "lib/components/primitive-components/Group/region-replacement"

test("getSourceTraceIdsFromRerouteName parses joined mst route ids", () => {
  expect(
    getSourceTraceIdsFromRerouteName("source_trace_0__source_trace_1_mst0_0"),
  ).toEqual(["source_trace_0", "source_trace_1"])
})

test("getSourceTraceIdsFromRerouteName preserves reroute source ids", () => {
  expect(getSourceTraceIdsFromRerouteName("source_trace_0_reroute_1")).toEqual([
    "source_trace_0_reroute_1",
    "source_trace_0",
  ])
})
