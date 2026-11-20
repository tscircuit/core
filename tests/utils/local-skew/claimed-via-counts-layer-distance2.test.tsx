import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a via adds its layer distance to local skew, like a claimed via", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="22mm"
      height="6mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          return simpleRouteJson.connections.map((connection) => {
            const [start, end] = connection.pointsToConnect
            if (start.layer === end.layer) {
              return {
                type: "pcb_trace",
                pcb_trace_id: "trace_dn",
                connection_name: connection.name,
                route: [
                  { ...start, route_type: "wire", width: 0.15 },
                  { ...end, route_type: "wire", width: 0.15 },
                ],
              }
            }
            return {
              type: "pcb_trace",
              pcb_trace_id: "trace_dp",
              connection_name: connection.name,
              route: [
                { ...start, route_type: "wire", width: 0.15 },
                {
                  x: -4,
                  y: 0.4,
                  route_type: "wire",
                  width: 0.15,
                  layer: "top",
                },
                {
                  x: -4,
                  y: 0.4,
                  route_type: "via",
                  from_layer: "top",
                  to_layer: "bottom",
                },
                { ...end, route_type: "wire", width: 0.15 },
              ],
            }
          })
        }),
      }}
    >
      <testpoint
        name="P1"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={-9}
        pcbY={0.4}
      />
      <testpoint
        name="P2"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        layer="bottom"
        pcbX={9}
        pcbY={0.4}
      />
      <testpoint
        name="N1"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        layer="bottom"
        pcbX={-9}
        pcbY={-0.4}
      />
      <testpoint
        name="N2"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        layer="bottom"
        pcbX={9}
        pcbY={-0.4}
      />
      <trace name="DP" from=".P1 > .pin1" to=".P2 > .pin1" />
      <trace name="DN" from=".N1 > .pin1" to=".N2 > .pin1" />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.65mm"
      />
      <pcbnotetext
        pcbY={2}
        fontSize={0.4}
        text="DP drops to bottom through a routed via"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const [dp] = circuit.db.pcb_trace.list()
  expect(dp.route.map((point) => point.route_type)).toContain("via")
  // DP is ahead by the board thickness once both traces are on bottom, the
  // same as when it claims a via (claimed-via-counts-layer-distance1).
  const [localSkew] = circuit.db
    .toArray()
    .filter(
      (element) => String(element.type) === "pcb_differential_pair_local_skew",
    )
  expect(localSkew).toMatchObject({
    max_local_skew: circuit.db.pcb_board.list()[0].thickness,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
