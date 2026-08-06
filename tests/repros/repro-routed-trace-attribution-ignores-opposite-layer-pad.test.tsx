import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routed trace endpoints over a large opposite-layer pad are attributed to the correct source trace", async () => {
  const { circuit } = getTestFixture()

  // BAT is declared first so its GND source trace is first in db order: with
  // layer-blind endpoint attribution, every top-layer endpoint over BAT's
  // giant bottom pad picks up a phantom BAT.pin1 port, the exact source-trace
  // match fails, and the fallback returns the GND trace for signal traces.
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="BAT"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="10mm"
              height="10mm"
              layer="bottom"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              layer="top"
              portHints={["pin1"]}
              pcbX={-3}
              pcbY={0}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              layer="top"
              portHints={["pin2"]}
              pcbX={3}
              pcbY={0}
            />
          </footprint>
        }
      />
      <trace from="BAT.pin1" to="net.GND" />
      <trace from="U1.pin1" to="U1.pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const db = circuit.db

  const signalSourceTrace = db.source_trace
    .list()
    .find((sourceTrace) => sourceTrace.display_name?.includes("U1"))
  expect(signalSourceTrace).toBeDefined()

  // Simulate an autorouted top-layer trace between U1.pin1 and U1.pin2. The
  // autorouter emits wire points without pcb_port ids, so the source trace
  // must be recovered from endpoint geometry.
  const routedTrace = {
    type: "pcb_trace" as const,
    pcb_trace_id: "synthetic_routed_trace",
    route: [
      { route_type: "wire" as const, x: -3, y: 0, width: 0.15, layer: "top" },
      { route_type: "wire" as const, x: 3, y: 0, width: 0.15, layer: "top" },
    ],
  }

  const attributedSourceTraceId = getSourceTraceIdForRoutedTrace({
    db,
    trace: routedTrace as any,
  })

  expect(attributedSourceTraceId).toBe(signalSourceTrace!.source_trace_id)
})
