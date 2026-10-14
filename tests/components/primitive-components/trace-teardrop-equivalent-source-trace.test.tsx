import { expect, test } from "bun:test"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Trace_doInitialPcbTraceTeardropRender } from "lib/components/primitive-components/Trace/Trace_doInitialPcbTraceTeardropRender"
import { TeardropNoteArrow } from "tests/fixtures/teardrop-note-arrow"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("teardrops follow routed traces attributed to an equivalent source trace", async () => {
  const { circuit } = getTestFixture({
    platform: { drcChecksDisabled: true },
  })
  circuit.add(
    <board width={16} height={8}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={4} />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".R2 > .pin1" to="net.GND" />
      <pcbnotetext
        pcbX={-3.5}
        pcbY={2.1}
        text="Expected teardrop from equivalent net trace"
        fontSize={0.3}
      />
      <TeardropNoteArrow from={{ x: -3.5, y: 1.7 }} to={{ x: -3.25, y: 0 }} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const [requestingTrace, equivalentTrace] = circuit.selectAll(
    "trace",
  ) as Trace[]
  if (!requestingTrace.source_trace_id || !equivalentTrace.source_trace_id) {
    throw new Error("Expected both logical traces to have source trace IDs")
  }
  if (
    !requestingTrace.subcircuit_connectivity_map_key ||
    !equivalentTrace.subcircuit_connectivity_map_key
  ) {
    throw new Error("Expected both logical traces to have connectivity keys")
  }
  expect(requestingTrace.subcircuit_connectivity_map_key).toBe(
    equivalentTrace.subcircuit_connectivity_map_key,
  )

  const routedTrace = circuit.db.pcb_trace.list({
    source_trace_id: requestingTrace.source_trace_id,
  })[0]
  circuit.db.pcb_trace.update(routedTrace.pcb_trace_id, {
    source_trace_id: equivalentTrace.source_trace_id,
  })

  Trace_doInitialPcbTraceTeardropRender({
    root: requestingTrace.root,
    source_trace_id: requestingTrace.source_trace_id,
    _parsedProps: {
      ...requestingTrace._parsedProps,
      pcbTeardropStart: true,
    },
    _findConnectedPorts: () => requestingTrace._findConnectedPorts(),
    _getTracePortOrNetSelectorListFromProps: () =>
      requestingTrace._getTracePortOrNetSelectorListFromProps(),
  })

  const teardrops = circuit.db.pcb_trace
    .list()
    .flatMap((pcbTrace) => pcbTrace.route)
    .filter(
      (routePoint) =>
        routePoint.route_type === "wire" &&
        routePoint.width_interpolation_mode === "quadratic",
    )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(teardrops).toHaveLength(0)
})
