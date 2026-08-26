import { expect, test } from "bun:test"
import type { LayerRef } from "circuit-json"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Core keeps an inner8 logical route on physical through-all vias", async () => {
  const { circuit } = getTestFixture()
  let autorouterLayerCount: number | undefined
  const throughAllLayers: LayerRef[] = [
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "inner7",
    "inner8",
    "bottom",
  ]

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      layers={10}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          autorouterLayerCount = simpleRouteJson.layerCount
          const connection = simpleRouteJson.connections[0]
          const [start, end] = connection.pointsToConnect
          const width =
            connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth
          const leftViaX = start.x + 1
          const rightViaX = end.x - 1

          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "pcb_trace_ten_layer",
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
                  layers: throughAllLayers,
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
                  layers: throughAllLayers,
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
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from="R1.pin2" to="R2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autorouterLayerCount).toBe(10)
  expect(
    circuit.db.pcb_trace
      .list()[0]
      .route.some(
        (routePoint) =>
          routePoint.route_type === "wire" && routePoint.layer === "inner8",
      ),
  ).toBe(true)

  expect(
    circuit.db.pcb_trace
      .list()
      .flatMap((trace) => trace.route)
      .filter((routePoint) => routePoint.route_type === "via")
      .every((routePoint) => !("layers" in routePoint)),
  ).toBe(true)
  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(2)
  expect(vias.map((via) => via.layers)).toEqual([
    throughAllLayers,
    throughAllLayers,
  ])
  expect(vias.map((via) => [via.from_layer, via.to_layer])).toEqual([
    ["top", "inner8"],
    ["inner8", "top"],
  ])
})
