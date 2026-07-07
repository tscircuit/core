import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

// A GND copper pour tessellates into many obstacles, and the connectivity
// expansion used to push getIdsConnectedToNet(id) onto each obstacle's
// connectedTo without deduping. The returned sets overlap heavily, so
// connectedTo exploded (a real board hit 21,171 entries, 191 unique, per pour
// rect) and the SimpleRouteJson ballooned to tens of MB. Guard that each
// obstacle's connectedTo stays duplicate-free.
test("obstacle connectedTo is deduped for a GND copper pour", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <copperpour unbroken connectsTo="net.GND" layer="bottom" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={0}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={6}
        pcbY={0}
        connections={{ pin2: "net.GND" }}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={-6}
        pcbY={6}
        connections={{ pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        pcbX={6}
        pcbY={6}
        connections={{ pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = (circuit as any).firstChild
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: board.subcircuit_id,
    subcircuitComponent: board,
  })

  for (const obstacle of simpleRouteJson.obstacles) {
    expect(obstacle.connectedTo.length).toBe(new Set(obstacle.connectedTo).size)
  }
})
