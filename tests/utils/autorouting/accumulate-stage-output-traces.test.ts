import { expect, test } from "bun:test"
import { getAccumulatedPcbTracesWithStageOutputReplacements } from "lib/components/primitive-components/Group/get-accumulated-pcb-traces-with-stage-output-replacements"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

const makeTrace = (pcbTraceId: string, x: number): SimplifiedPcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: pcbTraceId,
  route: [
    { route_type: "wire", x, y: 0, width: 0.15, layer: "top" },
    { route_type: "wire", x: x + 1, y: 0, width: 0.15, layer: "top" },
  ],
})

test("stage output replaces accumulated IDs while preserving split sections", () => {
  const accumulatedTrace = makeTrace("split", 0)
  const firstReplacementSection = makeTrace("split", 2)
  const secondReplacementSection = makeTrace("split", 4)
  const retainedTrace = makeTrace("retained", 6)

  expect(
    getAccumulatedPcbTracesWithStageOutputReplacements({
      accumulatedPcbTraces: [accumulatedTrace, retainedTrace],
      stageOutputPcbTraces: [firstReplacementSection, secondReplacementSection],
    }),
  ).toEqual([retainedTrace, firstReplacementSection, secondReplacementSection])
})
