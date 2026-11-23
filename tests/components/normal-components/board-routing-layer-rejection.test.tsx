import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects a custom router result that adds a track on a reserved plane", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      layers={4}
      routingLayers={["top", "bottom"]}
      width={12}
      height={8}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (srj) => [
          {
            type: "pcb_trace",
            pcb_trace_id: "restricted_trace",
            connection_name: srj.connections[0].name,
            route: [
              { route_type: "wire", x: -2, y: 0, width: 0.15, layer: "inner1" },
              { route_type: "wire", x: 2, y: 0, width: 0.15, layer: "inner1" },
            ],
          },
        ]),
      }}
    >
      <resistor name="R1" pcbX={-2} footprint="0402" resistance="1k" />
      <resistor name="R2" pcbX={2} footprint="0402" resistance="1k" />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toBeEmpty()
  expect(circuit.db.pcb_autorouting_error.list()[0]?.message).toContain(
    "routed copper on inner1",
  )
})
