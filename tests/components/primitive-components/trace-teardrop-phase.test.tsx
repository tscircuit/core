import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Trace_doInitialPcbTraceTeardropRender } from "lib/components/primitive-components/Trace/Trace_doInitialPcbTraceTeardropRender"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"

test("teardrop phase honors logical endpoints, preserves its baseline, and is idempotent", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={10} height={5}>
      <chip
        name="U1"
        pcbX={-3}
        pinLabels={{ pin1: "FROM" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} shape="rect" width={1} height={1} />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={3}
        pinLabels={{ pin1: "TO" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} shape="circle" radius={0.5} />
          </footprint>
        }
      />
      <trace
        name="signal"
        from="U1.1"
        to="U2.1"
        thickness={0.2}
        pcbPath={[{ x: 0, y: 0 }]}
      />
      <pcbnotetext
        pcbY={1.5}
        text="FROM only; stored route reversed"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const trace = circuit.selectOne("trace") as Trace
  const pcbTrace = circuit.db.pcb_trace.list()[0]
  const original = reversePcbTraceRoute(pcbTrace.route)
  circuit.db.pcb_trace.update(pcbTrace.pcb_trace_id, { route: original })
  // Supply the pending parsed prop shape without changing the component input.
  const context = {
    root: trace.root,
    source_trace_id: trace.source_trace_id,
    _parsedProps: {
      ...trace._parsedProps,
      pcbTeardrops: true,
      pcbTeardropStart: true,
      pcbTeardropEnd: false,
    },
    _findConnectedPorts: () => trace._findConnectedPorts(),
    _getTracePortOrNetSelectorListFromProps: () =>
      trace._getTracePortOrNetSelectorListFromProps(),
  }
  Trace_doInitialPcbTraceTeardropRender(context)
  const route = circuit.db.pcb_trace.get(pcbTrace.pcb_trace_id)!.route
  const tapers = route.filter(
    (p) => p.route_type === "wire" && p.width_interpolation_mode,
  )
  expect(tapers).toHaveLength(1)
  expect(tapers[0]).toMatchObject({ start_width: 0.2, end_width: 0.8 })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  Trace_doInitialPcbTraceTeardropRender(context)
  expect(circuit.db.pcb_trace.get(pcbTrace.pcb_trace_id)!.route).toEqual(route)
  // Pour marking may clone route points after the phase.
  circuit.db.pcb_trace.update(pcbTrace.pcb_trace_id, {
    route: circuit.db.pcb_trace
      .get(pcbTrace.pcb_trace_id)!
      .route.map((point) => ({
        ...point,
        is_inside_copper_pour: true,
        copper_pour_id: "pour",
      })),
  })
  context._parsedProps = {
    ...context._parsedProps,
    pcbTeardrops: false,
    pcbTeardropStart: false,
  }
  Trace_doInitialPcbTraceTeardropRender(context)
  expect(circuit.db.pcb_trace.get(pcbTrace.pcb_trace_id)!.route).toEqual(
    original,
  )
})
