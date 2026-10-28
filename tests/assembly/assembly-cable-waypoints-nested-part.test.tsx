import { expect, test } from "bun:test"
import { assembly } from "lib"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested part waypoints use their inherited PCB instead of their parent assembly axes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board
        name="START"
        width={30}
        height={20}
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
        />
      </board>
      <board
        name="CARRIER"
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
      {createElement(
        assembly.screen,
        { name: "SCREEN", connectsTo: ".J2", cadModel: "soic8" },
        <assembly.subassembly name="MODULE">
          <assembly.part name="HOLDER">
            <assembly.referencesurface
              name="socket"
              centerXOffset={2}
              centerYOffset={3}
              centerZOffset={4}
            />
          </assembly.part>
        </assembly.subassembly>,
      )}
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to="HOLDER.socket"
        model="jst_ph_pins3"
        waypointAnchor="end"
        waypointAxisOrientation="board_at_end"
        waypoints={[{ x: 4, y: 7, z: 9 }]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cable = circuit.db.cad_cable.list()[0]!
  const socket = circuit.db.cad_reference_surface
    .list()
    .find(
      (surface) =>
        surface.source_component_id === cable.to_source_component_id &&
        surface.name === "socket",
    )!
  const [waypoint] = cable.path.slice(2, -2)
  expect(cable.path.slice(2, -2)).toHaveLength(1)
  expect(waypoint!.x).toBeCloseTo(socket.center.x + 7)
  expect(waypoint!.y).toBeCloseTo(socket.center.y - 4)
  expect(waypoint!.z).toBeCloseTo(socket.center.z + 9)
})
