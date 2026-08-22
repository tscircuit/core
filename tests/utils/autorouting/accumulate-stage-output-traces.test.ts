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

test("accumulated stage output removes exact duplicate traces", () => {
  const replacedTrace = makeTrace("split", 0)
  const firstSection = makeTrace("split", 2)
  const secondSection = makeTrace("split", 4)

  expect(
    getAccumulatedPcbTracesWithStageOutputReplacements({
      accumulatedPcbTraces: [replacedTrace],
      stageOutputPcbTraces: [
        firstSection,
        structuredClone(firstSection),
        secondSection,
      ],
    }),
  ).toEqual([firstSection, secondSection])
})
