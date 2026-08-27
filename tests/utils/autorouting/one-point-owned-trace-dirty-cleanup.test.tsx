import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty dirty output removes an owned one-point trace and its via", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      layers={2}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          const connection = simpleRouteJson.connections[0]!
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "one_point_trace",
              connection_name: connection.name,
              route: [
                {
                  route_type: "via",
                  x: 0,
                  y: 0,
                  from_layer: "top",
                  to_layer: "bottom",
                },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.36}
        text="DIRTY EMPTY OUTPUT — COPPER REMOVED"
      />
      <pcbnoterect
        pcbX={0}
        pcbY={0}
        width={0.8}
        height={0.8}
        color="rgba(255,140,0,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={0}
        pcbY={2}
        fontSize={0.3}
        text="NO STALE ONE-POINT TRACE / VIA"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toMatchObject([
    { pcb_trace_id: "one_point_trace" },
  ])
  expect(circuit.db.pcb_via.list()).toMatchObject([
    { pcb_trace_id: "one_point_trace", x: 0, y: 0 },
  ])

  const board = circuit.firstChild as Group
  board._asyncAutoroutingResult = { output_pcb_traces: [] }
  board._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toEqual([])
  expect(circuit.db.pcb_via.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
