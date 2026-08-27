import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("conflicting shared via dimensions are rejected before copper insertion", async () => {
  const { circuit } = getTestFixture()
  let pcbTracesBeforeMaterialization: ReturnType<
    typeof circuit.db.pcb_trace.list
  > = []
  let pcbViasBeforeMaterialization: ReturnType<typeof circuit.db.pcb_via.list> =
    []

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      layers={2}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          const connection = simpleRouteJson.connections[0]!
          const [start, end] = connection.pointsToConnect
          const sourceTrace = connection.source_trace_id
            ? circuit.db.source_trace.get(connection.source_trace_id)
            : undefined
          const existingPcbTrace = circuit.db.pcb_trace.insert({
            pcb_trace_id: "conflicting_trace",
            source_trace_id: connection.source_trace_id,
            subcircuit_id: sourceTrace?.subcircuit_id,
            route: [
              {
                route_type: "wire",
                x: start!.x,
                y: start!.y,
                width: 0.15,
                layer: "top",
              },
              {
                route_type: "wire",
                x: -1,
                y: 0,
                width: 0.15,
                layer: "top",
              },
            ],
          } as Parameters<typeof circuit.db.pcb_trace.insert>[0])
          circuit.db.pcb_via.insert({
            pcb_trace_id: existingPcbTrace.pcb_trace_id,
            x: -1,
            y: 0,
            hole_diameter: 0.2,
            outer_diameter: 0.4,
            layers: ["top", "bottom"],
            from_layer: "top",
            to_layer: "bottom",
            subcircuit_id: sourceTrace?.subcircuit_id,
          })
          pcbTracesBeforeMaterialization = structuredClone(
            circuit.db.pcb_trace.list(),
          )
          pcbViasBeforeMaterialization = structuredClone(
            circuit.db.pcb_via.list(),
          )
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "conflicting_trace",
              connection_name: connection.name,
              route: [
                {
                  route_type: "wire",
                  x: start!.x,
                  y: start!.y,
                  width: 0.15,
                  layer: "top",
                },
                {
                  route_type: "via",
                  x: 0,
                  y: 0,
                  from_layer: "top",
                  to_layer: "bottom",
                  via_hole_diameter: 0.2,
                  via_diameter: 0.4,
                },
              ],
            },
            {
              type: "pcb_trace",
              pcb_trace_id: "conflicting_trace",
              connection_name: connection.name,
              route: [
                {
                  route_type: "wire",
                  x: end!.x,
                  y: end!.y,
                  width: 0.15,
                  layer: "bottom",
                },
                {
                  route_type: "via",
                  x: 0,
                  y: 0,
                  from_layer: "bottom",
                  to_layer: "top",
                  via_hole_diameter: 0.25,
                  via_diameter: 0.5,
                },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} pcbY={0} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={3}
        pcbY={0}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "Autorouter returned conflicting dimensions for shared via",
  )
  expect(pcbTracesBeforeMaterialization).toHaveLength(1)
  expect(pcbViasBeforeMaterialization).toHaveLength(1)
  expect(pcbTracesBeforeMaterialization[0]?.pcb_trace_id).toBe(
    "conflicting_trace",
  )
  expect(pcbViasBeforeMaterialization[0]?.pcb_trace_id).toBe(
    "conflicting_trace",
  )
  expect(circuit.db.pcb_trace.list()).toEqual(pcbTracesBeforeMaterialization)
  expect(circuit.db.pcb_via.list()).toEqual(pcbViasBeforeMaterialization)
})
