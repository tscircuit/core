import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("waypoint anchor and board axes are selected independently", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board
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
          layer="bottom"
        />
      </board>
      <board
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
        name="START_START"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_start"
        waypoints={[{ x: 4, y: 7, z: 9 }]}
      />
      <assembly.cable
        name="START_END"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_end"
        waypoints={[{ x: 4, y: 7, z: 9 }]}
      />
      <assembly.cable
        name="END_START"
        from=".J1"
        to=".J2"
        waypointAnchor="end"
        waypointAxisOrientation="board_at_start"
        waypoints={[{ x: 4, y: 7, z: 9 }]}
      />
      <assembly.cable
        name="END_END"
        from=".J1"
        to=".J2"
        waypointAnchor="end"
        waypointAxisOrientation="board_at_end"
        waypoints={[{ x: 4, y: 7, z: 9 }]}
      />
      <assembly.cable
        name="AUTO"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_start"
      />
      <assembly.cable
        name="EMPTY"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_start"
        waypoints={[]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const [startStart, startEnd, endStart, endEnd, auto, empty] =
    circuit.db.cad_cable.list()
  const start = circuit.db.pcb_component
    .list()
    .find(
      (connector) =>
        connector.source_component_id === startStart!.from_source_component_id,
    )!.center
  const end = circuit.db.pcb_component
    .list()
    .find(
      (connector) =>
        connector.source_component_id === endEnd!.to_source_component_id,
    )!.center
  expect(startStart!.path.length).toBeGreaterThan(5)
  expect(startStart!.path).toContainEqual({
    x: expect.closeTo(start.x - 7),
    y: expect.closeTo(start.y + 4),
    z: expect.closeTo(2.2),
  })
  expect(startEnd!.path).toContainEqual({
    x: expect.closeTo(start.x + 7),
    y: expect.closeTo(start.y - 4),
    z: expect.closeTo(2.2),
  })
  expect(endStart!.path).toContainEqual({
    x: expect.closeTo(end.x - 7),
    y: expect.closeTo(end.y + 4),
    z: expect.closeTo(15.8),
  })
  expect(endEnd!.path).toContainEqual({
    x: expect.closeTo(end.x + 7),
    y: expect.closeTo(end.y - 4),
    z: expect.closeTo(15.8),
  })
  expect(startStart!.path[1]!.z - startStart!.path[0]!.z).toBeCloseTo(-0.1)
  expect(startStart!.path.at(-2)!.z - startStart!.path.at(-1)!.z).toBeCloseTo(
    0.1,
  )
  expect(empty!.path).toEqual(auto!.path)
})
