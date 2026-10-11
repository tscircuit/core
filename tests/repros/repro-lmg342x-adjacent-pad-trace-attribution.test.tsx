import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LMG342X pad-center route endpoints preserve source trace attribution", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U4"
        footprint={
          <footprint>
            <smtpad
              pcbX={1.27}
              shape="rotated_rect"
              width="0.89mm"
              height="2.41mm"
              ccwRotation={270}
              layer="top"
              portHints={["VOUT"]}
            />
            <smtpad
              shape="rotated_rect"
              width="0.89mm"
              height="2.41mm"
              ccwRotation={270}
              layer="top"
              portHints={["FB"]}
            />
          </footprint>
        }
      />
      <chip
        name="R25"
        pcbX={0}
        pcbY={-3}
        footprint={
          <footprint>
            <smtpad
              shape="rotated_rect"
              width="0.95mm"
              height="1mm"
              ccwRotation={90}
              layer="top"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <chip
        name="C1"
        pcbX={3}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              layer="top"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <trace from="U4.VOUT" to="C1.pin1" />
      <trace from="U4.FB" to="R25.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const feedbackSourceTrace = circuit.db.source_trace
    .list()
    .find((sourceTrace) => sourceTrace.display_name?.includes("R25"))
  expect(feedbackSourceTrace).toBeDefined()

  const routedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "lmg342x_feedback_route",
    route: [
      { route_type: "wire", x: 0, y: -3, width: 0.15, layer: "top" },
      { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
    ],
  }
  const attributedSourceTraceId = getSourceTraceIdForRoutedTrace({
    db: circuit.db,
    trace: routedTrace,
  })

  expect(attributedSourceTraceId).toBe(feedbackSourceTrace?.source_trace_id)
})
