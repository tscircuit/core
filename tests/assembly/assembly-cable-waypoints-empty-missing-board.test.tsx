import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty waypoints preserve the automatic route without requiring an endpoint board", async () => {
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
        name="AUTOMATIC"
        from=".J1"
        to="HOLDER.socket"
        model="jst_ph_pins3"
      />
      <assembly.cable
        name="EMPTY_WAYPOINTS"
        from=".J1"
        to="HOLDER.socket"
        model="jst_ph_pins3"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_end"
        waypoints={[]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cables = circuit.db.cad_cable.list()
  expect(cables).toHaveLength(2)
  expect(cables[1]!.path).toEqual(cables[0]!.path)
})
