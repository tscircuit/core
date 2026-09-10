import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Remove .failing when Group reuses vias shared by multiple routed traces.
test.failing(
  "same-net routes sharing a via should emit one pcb_via",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board
        width={16}
        height={12}
        minViaHoleDiameter={0.3}
        minViaPadDiameter={0.6}
        autorouter={{
          algorithmFn: createBasicAutorouter(async (srj) =>
            srj.connections.map((connection, routeIndex) => {
              const [start, end] =
                routeIndex === 0
                  ? connection.pointsToConnect
                  : [...connection.pointsToConnect].reverse()
              const width = 0.2
              // Board-space points in mm: +X right, +Y top, +Z above.
              // Both routes use one physical hole, in opposite layer directions.
              return {
                type: "pcb_trace",
                pcb_trace_id: `shared_via_route_${routeIndex}`,
                connection_name: connection.name,
                route: [
                  { route_type: "wire", ...start, width },
                  { route_type: "wire", x: 0, y: 0, layer: start.layer, width },
                  {
                    route_type: "via",
                    x: 0,
                    y: 0,
                    from_layer: start.layer,
                    to_layer: end.layer,
                  },
                  { route_type: "wire", x: 0, y: 0, layer: end.layer, width },
                  { route_type: "wire", ...end, width },
                ],
              }
            }),
          ),
        }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={2}
          layer="bottom"
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={-2}
          layer="bottom"
        />
        <trace from="R1.pin2" to="R2.pin1" />
        <trace from="R1.pin2" to="R3.pin1" />
        <pcbnotetext
          text="Shared via: one physical hole"
          pcbY={4.5}
          fontSize={0.6}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_trace.list()).toHaveLength(2)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    expect(circuit.db.pcb_via.list()).toHaveLength(1)
  },
)
