import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("waypoint axes reject an endpoint with no board despite another PCB in the device", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board
        name="CONTROL"
        width={30}
        height={20}
        pcbX={10}
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
      <assembly.part name="HOLDER">
        <assembly.referencesurface
          name="socket"
          centerXOffset={30}
          centerYOffset={15}
          centerZOffset={20}
        />
      </assembly.part>
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to="HOLDER.socket"
        model="jst_ph_pins3"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_end"
        waypoints={[{ x: 4, y: 7, z: 9 }]}
      />
    </assembly.device>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'assembly.cable "HARNESS" endpoint "HOLDER.socket" has no board for waypointAxisOrientation="board_at_end"',
  )
  expect(circuit.db.cad_cable.list()).toHaveLength(0)
})
