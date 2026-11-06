import { expect, test } from "bun:test"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a portless bridge between different source connections remains a short", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={14} schLayout={{ layoutMode: "none" }}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-4}
        pcbY={-3}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={-4} pcbY={3} />
      <resistor name="R3" resistance="1k" footprint="0603" pcbX={4} pcbY={-3} />
      <resistor name="R4" resistance="1k" footprint="0603" pcbX={4} pcbY={3} />
      <trace from="R1.pin1" to="R2.pin1" />
      <trace from="R3.pin1" to="R4.pin1" />
      <autoroutingphase
        algorithmFn={createBasicAutorouter(async (input) => {
          // Board-world points in mm (+X right, +Y up), all on top copper.
          const routes: SimplifiedPcbTrace[] = input.connections.map(
            (connection, index) => ({
              type: "pcb_trace",
              pcb_trace_id: `vertical_${index}`,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire",
                x: point.x,
                y: point.y,
                layer: "top",
                width: 0.2,
              })),
            }),
          )
          const bridge: SimplifiedPcbTrace = {
            type: "pcb_trace",
            pcb_trace_id: "shorting_bridge",
            route: input.connections.map((connection) => ({
              route_type: "wire",
              x: connection.pointsToConnect[0].x,
              y: 0,
              layer: "top",
              width: 0.2,
            })),
          }
          return [bridge, ...routes]
        })}
      />
      <pcbnotetext pcbY={5.5} fontSize={0.6} text="Two separate connections" />
      <pcbnotetext
        pcbY={-5}
        fontSize={0.5}
        text="Middle bridge is a real short"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(3)
  expect(traces[0].source_trace_id).toBeUndefined()
  expect(
    traces
      .slice(1)
      .map((trace) => trace.source_trace_id)
      .sort(),
  ).toEqual(
    circuit.db.source_trace
      .list()
      .map((trace) => trace.source_trace_id)
      .sort(),
  )
  expect(
    circuit.db.pcb_trace_error
      .list()
      .some((error) => error.message.includes("accidental contact")),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    // Hide overlapping labels only in the image; diagnostics are asserted above.
    shouldDrawErrors: false,
    showSolderMask: false,
    showSolderPaste: false,
  })
})
