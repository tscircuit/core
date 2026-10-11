import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LM5155 adjacent rotated pads preserve routed trace attribution", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="PGND_PAD"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              pcbX={0}
              pcbY={0}
              shape="rotated_rect"
              width="1mm"
              height="2.65mm"
              ccwRotation={270}
              layer="top"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <chip
        name="SIGNAL"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              pcbX={0.25}
              pcbY={-0.95}
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              layer="top"
              portHints={["pin1"]}
            />
            <smtpad
              pcbX={3}
              pcbY={-0.95}
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              layer="top"
              portHints={["pin2"]}
            />
          </footprint>
        }
      />
      <trace from="PGND_PAD.pin1" to="net.PGND" />
      <trace from="SIGNAL.pin1" to="SIGNAL.pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const signalSourceTrace = circuit.db.source_trace
    .list()
    .find((sourceTrace) => sourceTrace.display_name?.includes("SIGNAL"))
  expect(signalSourceTrace).toBeDefined()

  const routedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "lm5155_signal_route",
    route: [
      { route_type: "wire", x: 0.25, y: -0.95, width: 0.15, layer: "top" },
      { route_type: "wire", x: 3, y: -0.95, width: 0.15, layer: "top" },
    ],
  }
  const attributedSourceTraceId = getSourceTraceIdForRoutedTrace({
    db: circuit.db,
    trace: routedTrace,
  })

  expect(attributedSourceTraceId).toBe(signalSourceTrace?.source_trace_id)
})
