import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblyCable } from "lib/components/primitive-components/AssemblyCable"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("editing waypoints, anchor and axes updates the cable without detaching its ends", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board
        width={30}
        height={20}
        thickness={1.6}
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
      <board width={30} height={20} thickness={1.6} pcbX={40} routingDisabled>
        <connector
          name="J2"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
        />
      </board>
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_start"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const before = structuredClone(circuit.db.cad_cable.list()[0]!)
  const harness = circuit.selectOne(".HARNESS")
  if (!(harness instanceof AssemblyCable)) throw new Error("Missing cable")
  const waypoints = [{ x: 5, y: 30, z: 35 }]
  harness.setProps({
    ...harness.props,
    waypointAnchor: "end",
    waypointAxisOrientation: "board_at_end",
    waypoints,
  })
  await circuit.renderUntilSettled()
  const cables = circuit.db.cad_cable.list()
  expect(cables).toHaveLength(1)
  expect(cables[0]!.cad_cable_id).toBe(before.cad_cable_id)
  expect(cables[0]!.path[2]!.x).toBeCloseTo(45)
  expect(cables[0]!.path[2]!.y).toBeCloseTo(30)
  expect(cables[0]!.path[2]!.z).toBeCloseTo(41.8)
  expect(cables[0]!.path[0]).toEqual(before.path[0])
  expect(cables[0]!.path.at(-1)).toEqual(before.path.at(-1))
  expect(waypoints).toEqual([{ x: 5, y: 30, z: 35 }])
  harness.setProps({ ...harness.props, waypoints: [] })
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_cable.list()[0]!.path).toEqual(before.path)
})
