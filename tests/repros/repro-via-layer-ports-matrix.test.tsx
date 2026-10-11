import { expect, test } from "bun:test"
import type { LayerRef } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaLayerPortsBoard } from "tests/fixtures/via-layer-ports-board"

test("via layer ports cover the board-aware span and route each occupied layer", async () => {
  const failures: string[] = []
  let caseCount = 0
  for (const layerCount of [2, 4, 6, 8, 10] as const) {
    // Requirements-derived stack, independent of the via span implementation.
    const stack: LayerRef[] = [
      "top",
      ...Array.from(
        { length: layerCount - 2 },
        (_, i) => `inner${i + 1}` as LayerRef,
      ),
      "bottom",
    ]
    const spans = [stack, [...stack].reverse()]
    if (layerCount > 2) spans.push(stack.slice(0, -1), stack.slice(1, -1))
    for (const span of spans) {
      for (const explicit of [false, true]) {
        for (const traceLayer of span) {
          caseCount++
          const label = `${layerCount} layers: ${span.join(" -> ")}, explicit=${explicit}, trace=${traceLayer}`
          const { circuit } = getTestFixture()
          circuit.schematicDisabled = true
          circuit.add(
            <ViaLayerPortsBoard
              layerCount={layerCount}
              fromLayer={span[0]}
              toLayer={span[span.length - 1]}
              explicitLayers={explicit ? span : undefined}
              traceLayer={traceLayer}
              nested={!explicit}
            />,
          )
          await circuit.renderUntilSettled()
          try {
            const vias = circuit.db.pcb_via.list()
            expect(vias).toHaveLength(2)
            for (const via of vias) {
              expect(via.layers).toEqual(span)
              expect([via.hole_diameter, via.outer_diameter]).toEqual([
                0.3, 0.7,
              ])
              const ports = via.pcb_port_ids!.map(
                (id) => circuit.db.pcb_port.get(id)!,
              )
              expect(ports.map((port) => port.layers)).toEqual(
                span.map((layer) => [layer]),
              )
              expect(
                ports.map(
                  (port) =>
                    circuit.db.source_port.get(port.source_port_id!)!.name,
                ),
              ).toEqual(span)
              expect(ports.map((port) => [port.x, port.y])).toEqual(
                span.map(() => [via.x, via.y]),
              )
            }
            expect(circuit.db.source_trace_not_connected_error.list()).toEqual(
              [],
            )
            const traces = circuit.db.pcb_trace.list()
            expect(traces).toHaveLength(1)
            const route = traces[0].route
            expect([route[0], route.at(-1)]).toMatchObject([
              {
                route_type: "wire",
                x: -2,
                y: 0,
                layer: traceLayer,
                width: 0.2,
              },
              { route_type: "wire", x: 2, y: 0, layer: traceLayer, width: 0.2 },
            ])
            expect(
              route.every(
                (point) =>
                  point.route_type === "wire" &&
                  point.layer === traceLayer &&
                  point.width === 0.2,
              ),
            ).toBe(true)
            expect(traces[0].trace_length).toBe(4)
            const sourceTrace = circuit.db.source_trace.get(
              traces[0].source_trace_id!,
            )!
            expect(sourceTrace.connected_source_port_ids).toHaveLength(2)
            expect(
              sourceTrace.connected_source_port_ids.map(
                (id) => circuit.db.source_port.get(id)!.name,
              ),
            ).toEqual([traceLayer, traceLayer])
          } catch {
            failures.push(label)
          }
        }
      }
    }
  }
  console.log(
    `Via port matrix: ${caseCount - failures.length}/${caseCount} cases passed`,
  )
  expect(failures).toEqual([])
})
