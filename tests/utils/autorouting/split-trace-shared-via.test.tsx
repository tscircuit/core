import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("split autorouter traces share a reversed boundary via", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      layers={2}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          const connection = simpleRouteJson.connections[0]!
          const [start, end] = connection.pointsToConnect
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "shared_trace",
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
                  route_type: "wire",
                  x: 0,
                  y: 0,
                  width: 0.15,
                  layer: "top",
                },
                {
                  route_type: "via",
                  x: 0,
                  y: 0,
                  from_layer: "top",
                  to_layer: "bottom",
                },
              ],
            },
            {
              type: "pcb_trace",
              pcb_trace_id: "shared_trace",
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
                  route_type: "wire",
                  x: 0,
                  y: 0,
                  width: 0.15,
                  layer: "bottom",
                },
                {
                  route_type: "via",
                  x: 0,
                  y: 0,
                  from_layer: "bottom",
                  to_layer: "top",
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
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.38}
        text="SHARED VIA — REVERSED SPANS"
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
      <pcbnotetext pcbX={0} pcbY={1} fontSize={0.32} text="ONE PHYSICAL VIA" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(new Set(pcbTraces.map((trace) => trace.pcb_trace_id)).size).toBe(
    pcbTraces.length,
  )
  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(1)
  expect(vias[0]).toMatchObject({
    x: 0,
    y: 0,
    from_layer: "top",
    to_layer: "bottom",
    layers: ["top", "bottom"],
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
