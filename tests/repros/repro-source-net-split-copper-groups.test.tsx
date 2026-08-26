import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing DRC reports a source net split into two copper groups", async () => {
  const { circuit } = getTestFixture({
    platform: {
      netlistDrcChecksDisabled: true,
      placementDrcChecksDisabled: true,
    },
  })

  circuit.add(
    <board
      width="20mm"
      height="8mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(
          async (simpleRouteJson: SimpleRouteJson) => {
            const splitNetConnection = simpleRouteJson.connections.find(
              (connection) => connection.pointsToConnect.length === 4,
            )
            if (!splitNetConnection) {
              throw new Error("Expected one four-port named-net connection")
            }

            const points = [...splitNetConnection.pointsToConnect].sort(
              (pointA, pointB) => pointA.x - pointB.x,
            )
            const routePair = (startIndex: number, pcbTraceId: string) => ({
              type: "pcb_trace" as const,
              pcb_trace_id: pcbTraceId,
              connection_name: splitNetConnection.name,
              route: [points[startIndex]!, points[startIndex + 1]!].map(
                (point) => ({
                  route_type: "wire" as const,
                  x: point.x,
                  y: point.y,
                  width: 0.2,
                  layer: point.layer,
                }),
              ),
            })

            // Each pair is internally connected, but the two pairs are not.
            return [
              routePair(0, "pcb_trace_left_group"),
              routePair(2, "pcb_trace_right_group"),
            ]
          },
        ),
      }}
    >
      <net name="SPLIT_NET" />
      {[-7, -3, 3, 7].map((pcbX, index) => (
        <resistor
          key={index}
          name={`R${index + 1}`}
          resistance="1k"
          footprint="0402"
          pcbX={pcbX}
          pcbRotation={90}
        />
      ))}
      <trace from=".R1 > .pin1" to="net.SPLIT_NET" />
      <trace from=".R2 > .pin1" to="net.SPLIT_NET" />
      <trace from=".R3 > .pin1" to="net.SPLIT_NET" />
      <trace from=".R4 > .pin1" to="net.SPLIT_NET" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_trace_error.list()).toEqual([
    expect.objectContaining({
      source_trace_id: "source_net_0",
      message:
        "Net [SPLIT_NET] has 4 required PCB ports split across 2 disconnected copper groups.",
    }),
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
