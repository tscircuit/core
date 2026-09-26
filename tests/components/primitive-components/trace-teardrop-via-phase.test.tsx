import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Trace_doInitialPcbTraceTeardropRender } from "lib/components/primitive-components/Trace/Trace_doInitialPcbTraceTeardropRender"

test("post-routing phase adds teardrops on both sides of a via with endpoints disabled", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={12} height={8}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-3} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        pcbX={3}
        layer="bottom"
      />
      <trace
        from="R1.2"
        to="R2.1"
        thickness={0.15}
        pcbPath={[{ x: 0, y: 1, via: true, toLayer: "bottom" }]}
      />
      <pcbnotetext
        pcbY={3}
        text="Via teardrops on both layers; pads disabled"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const trace = circuit.selectOne("trace") as Trace
  Trace_doInitialPcbTraceTeardropRender({
    root: trace.root,
    source_trace_id: trace.source_trace_id,
    _parsedProps: {
      ...trace._parsedProps,
      pcbTeardrops: true,
      pcbTeardropStart: false,
      pcbTeardropEnd: false,
    },
    _findConnectedPorts: () => trace._findConnectedPorts(),
    _getTracePortOrNetSelectorListFromProps: () =>
      trace._getTracePortOrNetSelectorListFromProps(),
  })
  const tapers = circuit.db.pcb_trace
    .list()
    .flatMap((t) => t.route)
    .filter((p) => p.route_type === "wire" && p.width_interpolation_mode)
  expect(tapers).toHaveLength(2)
  expect(tapers.map((p) => p.route_type === "wire" && p.layer).sort()).toEqual([
    "bottom",
    "top",
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
