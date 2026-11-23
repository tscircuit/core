import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board routing layers reach the router and narrow the bus while preserving the physical stack", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      layers={4}
      routingLayers={["top", "inner2", "bottom"]}
      width={12}
      height={8}
      routingDisabled
    >
      <chip name="U1" footprint="soic8" pcbX={-3} />
      <chip name="U2" footprint="soic8" pcbX={3} />
      <trace name="DQ" from=".U1 > .pin1" to=".U2 > .pin1" />
      <bus
        name="data"
        connections={["DQ"]}
        pcbAllowedLayers={["top", "inner1"]}
      />
      <via
        pcbX={0}
        pcbY={1}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.2}
        outerDiameter={0.4}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.3}
        fontSize={0.34}
        text="Inner1 reserved. Through-via spans all four layers."
      />
    </board>,
  )
  circuit.render()
  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    num_layers: 4,
    routing_layers: ["top", "inner2", "bottom"],
  })
  expect(circuit.db.pcb_via.list()[0]?.layers).toEqual([
    "top",
    "inner1",
    "inner2",
    "bottom",
  ])
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild ?? undefined,
  })
  expect(simpleRouteJson.layerCount).toBe(4)
  expect(simpleRouteJson.routingLayers).toEqual(["top", "inner2", "bottom"])
  expect(simpleRouteJson.buses?.[0]?.allowedLayers).toEqual(["top"])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const imported = getTestFixture().circuit
  imported.add(<board circuitJson={circuit.getCircuitJson()} routingDisabled />)
  imported.render()
  expect(imported.db.pcb_board.list()[0]).toMatchObject({
    num_layers: 4,
    routing_layers: ["top", "inner2", "bottom"],
  })
})
