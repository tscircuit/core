import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Trace_doInitialPcbTraceTeardropRender } from "lib/components/primitive-components/Trace/Trace_doInitialPcbTraceTeardropRender"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"

test("teardrop phase honors logical endpoints, preserves its baseline, and is idempotent", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={20} height={12}>
      <resistor
        name="R1"
        resistance="100"
        footprint="0603"
        pcbX={-3}
        pcbY={1}
      />
      <capacitor
        name="C1"
        capacitance="10nF"
        footprint="0603"
        pcbX={3}
        pcbY={-1}
      />
      <chip name="J1" footprint="pinrow2" pcbX={-8} pcbY={0} pcbRotation={90} />
      <chip name="J2" footprint="pinrow2" pcbX={8} pcbY={0} pcbRotation={90} />
      <trace
        name="signal"
        from="R1.2"
        to="C1.1"
        thickness={0.2}
        pcbPath={[
          { x: 2, y: 0 },
          { x: 4, y: -2 },
        ]}
      />
      <trace from="J1.1" to="R1.1" thickness={0.2} pcbPath={[]} />
      <trace
        from="C1.1"
        to="J2.1"
        thickness={0.2}
        pcbPath={[
          { x: 0, y: 2 },
          { x: 2, y: 4 },
        ]}
      />
      <trace
        from="J1.2"
        to="C1.2"
        thickness={0.3}
        pcbPath={[
          { x: 0, y: -4 },
          { x: 10, y: -4 },
        ]}
      />
      <trace from="C1.2" to="J2.2" thickness={0.3} pcbPath={[]} />
      <pcbnotetext
        pcbY={5}
        text="RC input filter: R1 end only (reversed route)"
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Supporting RC-filter routes in board-world mm (+X right, +Y up).
  const waypoints = [
    [],
    [{ x: -5.73, y: 1 }],
    [
      { x: 2.15, y: -2.5 },
      { x: 6.77, y: -2.5 },
    ],
    [
      { x: -6.27, y: 3 },
      { x: 4.5, y: 3 },
      { x: 4.5, y: -0.35 },
    ],
    [{ x: 6.12, y: 1.27 }],
  ]
  for (const [index, pcbTrace] of circuit.db.pcb_trace.list().entries()) {
    if (!index) continue
    const first = pcbTrace.route[0]
    const last = pcbTrace.route.at(-1)!
    if (first.route_type !== "wire") throw new Error("Expected wire")
    circuit.db.pcb_trace.update(pcbTrace.pcb_trace_id, {
      route: [
        first,
        ...waypoints[index].map((point) => ({
          ...point,
          route_type: "wire" as const,
          width: first.width,
          layer: first.layer,
        })),
        last,
      ],
    })
  }
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
  expect(tapers[0]).toMatchObject({ start_width: 0.2 })
  expect(tapers[0].route_type === "wire" && tapers[0].end_width).toBeCloseTo(
    0.64,
  )
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
