import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace renders the public coordinate route with its layer and thickness", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10}>
      <pcbtrace
        layer="top"
        thickness="0.2mm"
        route={[
          { x: "-2mm", y: 0 },
          { x: "2mm", y: 0 },
        ]}
      />
      <pcbnotetext text="Public route: top, 0.2 mm" pcbY={3} fontSize={0.5} />
    </board>,
  )
  circuit.render()
  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()[0].route).toEqual([
    { route_type: "wire", x: -2, y: 0, layer: "top", width: 0.2 },
    { route_type: "wire", x: 2, y: 0, layer: "top", width: 0.2 },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
