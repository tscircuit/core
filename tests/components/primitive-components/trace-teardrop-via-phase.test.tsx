import { TeardropNoteArrow } from "tests/fixtures/teardrop-note-arrow"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Trace_doInitialPcbTraceTeardropRender } from "lib/components/primitive-components/Trace/Trace_doInitialPcbTraceTeardropRender"

test("post-routing phase adds teardrops on both sides of a via with endpoints disabled", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board
      width={20}
      height={14}
      pcbStyle={{ viaPadDiameter: 0.7, viaHoleDiameter: 0.3 }}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-3}
        pcbY={2.15}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        pcbX={3}
        pcbY={-2.15}
        layer="bottom"
      />
      <trace
        from="R1.2"
        to="R2.2"
        thickness={0.15}
        pcbPath={[{ x: 3, y: -2.15, via: true, toLayer: "bottom" }]}
      />
      <chip name="J1" footprint="pinrow2" pcbX={-8} pcbRotation={90} />
      <chip
        name="J2"
        footprint="pinrow2"
        pcbX={8}
        pcbRotation={90}
        layer="bottom"
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={3}
        pcbY={-4}
        layer="bottom"
      />
      <trace from="J1.1" to="R1.1" thickness={0.2} pcbPath={[]} />
      <trace from="R2.1" to="J2.1" thickness={0.2} pcbPath={[]} />
      <trace from="R2.1" to="C1.1" thickness={0.2} pcbPath={[]} />
      <trace
        from="C1.2"
        to="J2.2"
        thickness={0.3}
        pcbPath={[
          { x: 0, y: -2 },
          { x: -5.85, y: -2 },
        ]}
      />
      <pcbnotetext pcbX={-1.1} pcbY={3.9} text="Top teardrop" fontSize={0.3} />
      <TeardropNoteArrow from={{ x: -1.1, y: 3.5 }} to={{ x: -0.38, y: 0.5 }} />
      <pcbnotetext pcbX={2} pcbY={2.2} text="Bottom teardrop" fontSize={0.3} />
      <TeardropNoteArrow from={{ x: 2, y: 1.8 }} to={{ x: 0.5, y: -0.38 }} />
      <pcbnotetext
        pcbY={6}
        text="Signal layer change: via only, pads disabled"
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Keep the bottom-layer ground return clear of the signal pads, using
  // board-world mm (+X right, +Y up) rather than mirrored footprint offsets.
  const ground = circuit.db.pcb_trace.list().at(-1)!
  const first = ground.route[0]
  if (first.route_type !== "wire") throw new Error("Expected wire")
  circuit.db.pcb_trace.update(ground.pcb_trace_id, {
    route: [
      first,
      ...[
        { x: 2.15, y: -5.5 },
        { x: 6.5, y: -5.5 },
        { x: 8, y: -3 },
      ].map((point) => ({
        ...point,
        route_type: "wire" as const,
        layer: first.layer,
        width: first.width,
      })),
      ground.route.at(-1)!,
    ],
  })
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
