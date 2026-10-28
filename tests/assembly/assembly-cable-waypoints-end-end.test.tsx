import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { RotatedCableBoards } from "./fixtures/rotated-cable-boards"

test("end-anchored waypoints follow the end board axes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <RotatedCableBoards />
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to=".J2"
        waypointAnchor="end"
        waypointAxisOrientation="board_at_end"
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
  expect(waypoint!.x).toBeCloseTo(endConnector.center.x + 7)
  expect(waypoint!.y).toBeCloseTo(endConnector.center.y - 4)
  expect(waypoint!.z).toBeCloseTo(15.8)
})
