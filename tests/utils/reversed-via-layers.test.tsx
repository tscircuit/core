import { expect, test } from "bun:test"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via traversal on a route reversed from RX back to TX", async () => {
  const route = reversePcbTraceRoute([
    { route_type: "wire", x: -4, y: 0, width: 0.3, layer: "top" },
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "top" },
    { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "bottom" },
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "bottom" },
    { route_type: "wire", x: 4, y: 0, width: 0.3, layer: "bottom" },
  ])
  const via = route.find((point) => point.route_type === "via")!
  expect([via.from_layer, via.to_layer]).toEqual(["bottom", "top"])

  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={7} routingDisabled schematicDisabled>
      <pcbnotetext text="Trace from RX back to TX" pcbY={2.3} fontSize={0.6} />
      <pcbnotetext text="TX (top)" pcbX={-4} pcbY={0.9} fontSize={0.45} />
      <pcbnotetext text="RX (bottom)" pcbX={4} pcbY={0.9} fontSize={0.45} />
      <pcbnotetext
        text={`Via from ${via.from_layer} to ${via.to_layer}`}
        pcbY={-1.5}
        fontSize={0.65}
      />
    </board>,
  )
  circuit.render()
  circuit.db.pcb_trace.insert({ route })
  circuit.db.pcb_via.insert({
    x: 0,
    y: 0,
    layers: ["top", "bottom"],
    outer_diameter: 0.65,
    hole_diameter: 0.3,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    includeVersion: false,
  })
})
