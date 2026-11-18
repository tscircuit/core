import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { getSavedAutoroutingPhaseTracesFromPaths } from "lib/components/primitive-components/Group/get-saved-autorouting-phase-traces"
import type { Port } from "lib/components/primitive-components/Port"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Board-world millimeters: +X right, +Y up; the board is the phase group at
// the origin, so saved local coordinates equal board-world coordinates.
test("saved route replay keeps the connection's net clearance", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={12} routingDisabled schematicDisabled>
      <net
        name="RF"
        minTraceClearance={0.4}
        connectsTo={["R1.pin1", "R2.pin1"]}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.firstChild as Group<any>
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: board.subcircuit_id,
  })
  expect(simpleRouteJson.connections).toHaveLength(1)
  expect(simpleRouteJson.connections[0].minTraceClearance).toBe(0.4)

  const [start, end] = ["R1", "R2"].map((name) => {
    const port = circuit.selectOne(`.${name} > .pin1`) as Port
    return circuit.db.pcb_port.get(port.pcb_port_id!)!
  })
  // Detour above the resistors so the copper touches only the two endpoints.
  const route = [
    { x: start.x, y: start.y },
    { x: start.x, y: 3 },
    { x: end.x, y: 3 },
    { x: end.x, y: end.y },
  ].map((point) => ({
    route_type: "wire" as const,
    ...point,
    width: 0.2,
    layer: "top" as const,
  }))

  const { traces } = getSavedAutoroutingPhaseTracesFromPaths({
    group: board,
    subcircuit: board,
    paths: [{ connection: "R1.pin1", route }],
    phaseIndex: 0,
    input: simpleRouteJson,
    isFanout: false,
  })
  expect(traces).toHaveLength(1)
  expect(traces[0].minTraceClearance).toBe(0.4)

  // Later phases see saved copper as fixed obstacles.
  const laterPhase = withFixedTraces(
    { ...simpleRouteJson, traces },
    new Set([traces[0].pcb_trace_id]),
  )
  const savedCopper = laterPhase.obstacles.slice(
    simpleRouteJson.obstacles.length,
  )
  expect(savedCopper.length).toBeGreaterThan(0)
  expect(new Set(savedCopper.map((o) => o.minTraceClearance))).toEqual(
    new Set([0.4]),
  )
})
