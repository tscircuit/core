import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("coordinate vias retain wires on both sides of the layer transition", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={10}>
      <pcbtrace
        layer="top"
        thickness={0.3}
        route={[
          { x: -4, y: 0 },
          { x: 0, y: 0, via: true, to_layer: "bottom" },
          { x: 4, y: 2 },
        ]}
      />
      <pcbnotetext text="Top to bottom at origin" pcbY={3.5} fontSize={0.5} />
    </board>,
  )
  circuit.render()
  expect(circuit.db.pcb_trace.list()[0].route).toEqual([
    { route_type: "wire", x: -4, y: 0, width: 0.3, layer: "top" },
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "top" },
    { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "bottom" },
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "bottom" },
    { route_type: "wire", x: 4, y: 2, width: 0.3, layer: "bottom" },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
