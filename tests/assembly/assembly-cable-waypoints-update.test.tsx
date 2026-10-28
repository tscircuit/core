import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblyCable } from "lib/components/primitive-components/AssemblyCable"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("editing waypoints updates the existing cable without detaching its ends", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board width={50} height={30} thickness={1.6} routingDisabled>
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={3}
          pcbX={-15}
          footprint="jst3_ph"
        />
        <connector
          name="J2"
          standard="jst_ph"
          pinCount={3}
          pcbX={15}
          footprint="jst3_ph"
        />
      </board>
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_start"
        waypoints={[{ x: 0, y: 20, z: 30 }]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const before = structuredClone(circuit.db.cad_cable.list()[0]!)
  const harness = circuit.selectOne(".HARNESS")
  if (!(harness instanceof AssemblyCable))
    throw new Error("Missing assembly cable")
  const waypoints = [{ x: 5, y: 30, z: 35 }]
  harness.setProps({ ...harness.props, waypoints })
  await circuit.renderUntilSettled()
  const cables = circuit.db.cad_cable.list()
  expect(cables).toHaveLength(1)
  expect(cables[0]!.cad_cable_id).toBe(before.cad_cable_id)
  expect(cables[0]!.path.slice(2, -2)).toEqual([{ x: -10, y: 30, z: 41.8 }])
  expect(cables[0]!.path[0]).toEqual(before.path[0])
  expect(cables[0]!.path.at(-1)).toEqual(before.path.at(-1))
})
