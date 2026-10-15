import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Trace_doInitialPcbTraceTeardropRender } from "lib/components/primitive-components/Trace/Trace_doInitialPcbTraceTeardropRender"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { TeardropNoteArrow } from "tests/fixtures/teardrop-note-arrow"

interface TeardropOptions {
  pcbTeardrops?: boolean
  pcbTeardropStart?: boolean
  pcbTeardropEnd?: boolean
}

const renderTraceTeardrops = ({
  trace,
  teardropOptions,
}: {
  trace: Trace
  teardropOptions: TeardropOptions
}): void => {
  Trace_doInitialPcbTraceTeardropRender({
    root: trace.root,
    source_trace_id: trace.source_trace_id,
    _parsedProps: {
      ...trace._parsedProps,
      ...teardropOptions,
    },
    _findConnectedPorts: () => trace._findConnectedPorts(),
    _getTracePortOrNetSelectorListFromProps: () =>
      trace._getTracePortOrNetSelectorListFromProps(),
  })
}

const getQuadraticTeardropCount = (route: PcbTrace["route"]): number =>
  route.filter(
    (routePoint) =>
      routePoint.route_type === "wire" &&
      routePoint.width_interpolation_mode === "quadratic",
  ).length

test("equivalent trace owners restore shared teardrops in either order", async () => {
  const { circuit } = getTestFixture({
    platform: { drcChecksDisabled: true },
  })
  circuit.add(
    <board width={16} height={8}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={4} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        pcbX={-3.5}
        pcbY={2.1}
        text="Expected plain trace after both teardrop owners are disabled"
        fontSize={0.3}
      />
      <TeardropNoteArrow from={{ x: -3.5, y: 1.7 }} to={{ x: -3.25, y: 0 }} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const [firstTrace, secondTrace] = circuit.selectAll("trace") as Trace[]
  if (!firstTrace.source_trace_id || !secondTrace.source_trace_id) {
    throw new Error("Expected both logical traces to have source trace IDs")
  }
  if (
    !firstTrace.subcircuit_connectivity_map_key ||
    !secondTrace.subcircuit_connectivity_map_key
  ) {
    throw new Error("Expected both logical traces to have connectivity keys")
  }
  expect(firstTrace.subcircuit_connectivity_map_key).toBe(
    secondTrace.subcircuit_connectivity_map_key,
  )

  const [sharedPcbTrace, ...otherPcbTraces] = circuit.db.pcb_trace.list()
  if (!sharedPcbTrace) throw new Error("Expected a routed PCB trace")
  for (const pcbTrace of otherPcbTraces) {
    circuit.db.pcb_trace.delete(pcbTrace.pcb_trace_id)
  }
  circuit.db.pcb_trace.update(sharedPcbTrace.pcb_trace_id, {
    source_trace_id: secondTrace.source_trace_id,
  })

  renderTraceTeardrops({
    trace: firstTrace,
    teardropOptions: { pcbTeardropStart: true },
  })
  expect(
    getQuadraticTeardropCount(
      circuit.db.pcb_trace.get(sharedPcbTrace.pcb_trace_id)!.route,
    ),
  ).toBe(1)
  renderTraceTeardrops({
    trace: secondTrace,
    teardropOptions: { pcbTeardropEnd: true },
  })
  expect(
    getQuadraticTeardropCount(
      circuit.db.pcb_trace.get(sharedPcbTrace.pcb_trace_id)!.route,
    ),
  ).toBe(2)

  renderTraceTeardrops({ trace: firstTrace, teardropOptions: {} })
  renderTraceTeardrops({ trace: secondTrace, teardropOptions: {} })
  expect(
    getQuadraticTeardropCount(
      circuit.db.pcb_trace.get(sharedPcbTrace.pcb_trace_id)!.route,
    ),
  ).toBe(0)

  renderTraceTeardrops({
    trace: firstTrace,
    teardropOptions: { pcbTeardropStart: true },
  })
  renderTraceTeardrops({
    trace: secondTrace,
    teardropOptions: { pcbTeardropEnd: true },
  })
  renderTraceTeardrops({ trace: secondTrace, teardropOptions: {} })
  renderTraceTeardrops({ trace: firstTrace, teardropOptions: {} })
  expect(
    getQuadraticTeardropCount(
      circuit.db.pcb_trace.get(sharedPcbTrace.pcb_trace_id)!.route,
    ),
  ).toBe(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
