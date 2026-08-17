import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("runs routing DRC for a standalone subcircuit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <subcircuit
      name="ROUTING_DRC_REPRO"
      autorouter={{
        algorithmFn: createBasicAutorouter(
          async (simpleRouteJson: SimpleRouteJson) =>
            simpleRouteJson.connections.map((connection, index) => ({
              type: "pcb_trace",
              pcb_trace_id: index === 0 ? "trace_horizontal" : "trace_vertical",
              connection_name: connection.name,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire" as const,
                x: point.x,
                y: point.y,
                width: 0.15,
                layer: "top",
              })),
            })),
        ),
      }}
    >
      <resistor name="R_LEFT" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R_RIGHT" resistance="1k" footprint="0402" pcbX={3} />
      <resistor
        name="R_BOTTOM"
        resistance="1k"
        footprint="0402"
        pcbY={-3}
        pcbRotation={90}
      />
      <resistor
        name="R_TOP"
        resistance="1k"
        footprint="0402"
        pcbY={3}
        pcbRotation={90}
      />
      <trace from=".R_LEFT > .pin2" to=".R_RIGHT > .pin1" />
      <trace from=".R_BOTTOM > .pin2" to=".R_TOP > .pin1" />
    </subcircuit>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace_error.list()[0]?.message).toContain(
    "overlaps with trace",
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
