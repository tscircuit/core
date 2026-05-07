import { expect, test } from "bun:test"
import { pcb_trace as pcbTraceSchema } from "circuit-json"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouted through_obstacle route points are not written to pcb_trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      layers={4}
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: createBasicAutorouter(async () => [
          {
            type: "pcb_trace",
            pcb_trace_id: "pcb_trace_repro_through_obstacle",
            route: [
              { route_type: "wire", x: -5, y: 0, width: 0.15, layer: "top" },
              {
                route_type: "through_obstacle",
                start: { x: -5, y: 0 },
                end: { x: 5, y: 0 },
                from_layer: "top",
                to_layer: "inner1",
                width: 0.15,
              },
              { route_type: "wire", x: 5, y: 0, width: 0.15, layer: "inner1" },
            ],
          },
        ]),
      }}
    >
      <resistor name="R1" pcbX={-5} pcbY={0} resistance="1k" footprint="0402" />
      <resistor name="R2" pcbX={5} pcbY={0} resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_trace = circuit.db.pcb_trace.list()[0]

  expect(pcb_trace.route.map((routePoint) => routePoint.route_type)).toEqual([
    "wire",
    "via",
    "wire",
    "wire",
  ])
  expect(pcb_trace.route).not.toContainEqual(
    expect.objectContaining({ route_type: "through_obstacle" }),
  )
  expect(pcbTraceSchema.safeParse(pcb_trace).success).toBe(true)
})
