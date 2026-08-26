import { expect, test } from "bun:test"
import type { LayerRef } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("allowBlindAndBuriedVias preserves logical autorouted via spans", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      layers={10}
      allowBlindAndBuriedVias
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          autorouterInput = simpleRouteJson
          const connection = simpleRouteJson.connections[0]
          const [start, end] = connection.pointsToConnect
          const width =
            connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth
          const leftViaX = start.x + 1
          const rightViaX = end.x - 1

          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "pcb_trace_blind_buried_opt_in",
              connection_name: connection.name,
              route: [
                { route_type: "wire", ...start, width },
                {
                  route_type: "wire",
                  x: leftViaX,
                  y: start.y,
                  width,
                  layer: "top",
                },
                {
                  route_type: "via",
                  x: leftViaX,
                  y: start.y,
                  from_layer: "top",
                  to_layer: "inner8",
                },
                {
                  route_type: "wire",
                  x: leftViaX,
                  y: start.y,
                  width,
                  layer: "inner8",
                },
                {
                  route_type: "wire",
                  x: rightViaX,
                  y: end.y,
                  width,
                  layer: "inner8",
                },
                {
                  route_type: "via",
                  x: rightViaX,
                  y: end.y,
                  from_layer: "inner8",
                  to_layer: "top",
                },
                {
                  route_type: "wire",
                  x: rightViaX,
                  y: end.y,
                  width,
                  layer: "top",
                },
                { route_type: "wire", ...end, width },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin2" to="R2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    allow_blind_and_buried_vias: true,
  })
  expect(autorouterInput?.allowBlindAndBuriedVias).toBe(true)

  const topToInner8Layers: LayerRef[] = [
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "inner7",
    "inner8",
  ]
  const inner8ToTopLayers = [...topToInner8Layers].reverse()
  const vias = circuit.db.pcb_via.list()

  expect(vias).toHaveLength(2)
  expect(vias.map((via) => via.layers)).toEqual([
    topToInner8Layers,
    inner8ToTopLayers,
  ])
  expect(vias.map((via) => [via.from_layer, via.to_layer])).toEqual([
    ["top", "inner8"],
    ["inner8", "top"],
  ])
})
