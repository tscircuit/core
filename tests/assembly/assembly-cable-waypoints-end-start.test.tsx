import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("end-anchored waypoints follow the start board axes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board
        name="START"
        width={30}
        height={20}
        thickness={1.6}
        pcbX={20}
        pcbY={10}
        pcbRotation={90}
        routingDisabled
      >
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
          pcbX={3}
          pcbY={5}
          pcbRotation={30}
        />
      </board>
      <board
        name="END"
        width={30}
        height={20}
        thickness={1.6}
        pcbX={-30}
        pcbY={-20}
        pcbRotation={270}
        routingDisabled
      >
        <connector
          name="J2"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
          pcbX={3}
          pcbY={5}
          pcbRotation={120}
        />
      </board>
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to=".J2"
        waypointAnchor="end"
        waypointAxisOrientation="board_at_start"
        waypoints={[{ x: 4, y: 7, z: 9 }]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cable = circuit.db.cad_cable.list()[0]!
  const endConnector = circuit.db.pcb_component
    .list()
    .find(
      (connector) =>
        connector.source_component_id === cable.to_source_component_id,
    )!
  const [waypoint] = cable.path.slice(2, -2)
  expect(cable.path.slice(2, -2)).toHaveLength(1)
  expect(waypoint!.x).toBeCloseTo(endConnector.center.x - 7)
  expect(waypoint!.y).toBeCloseTo(endConnector.center.y + 4)
  expect(waypoint!.z).toBeCloseTo(15.8)
})
