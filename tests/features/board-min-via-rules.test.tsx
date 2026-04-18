import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("board min via rules flow into srj and routed vias", async () => {
  const { circuit } = getTestFixture()

  let capturedSimpleRouteJson: SimpleRouteJson | undefined

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      minViaDiameter="0.6mm"
      minViaHole="0.3mm"
      autorouter={{
        local: true,
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          capturedSimpleRouteJson = simpleRouteJson

          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "trace_0",
              connection_name: simpleRouteJson.connections[0]!.name,
              route: [
                {
                  route_type: "wire",
                  x: -4,
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
                {
                  route_type: "wire",
                  x: 4,
                  y: 0,
                  width: 0.15,
                  layer: "bottom",
                },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(capturedSimpleRouteJson?.minViaDiameter).toBe(0.6)
  expect(capturedSimpleRouteJson?.minViaHole).toBe(0.3)

  const via = circuit.db.pcb_via.list()[0]
  expect(via?.outer_diameter).toBe(0.6)
  expect(via?.hole_diameter).toBe(0.3)
})
