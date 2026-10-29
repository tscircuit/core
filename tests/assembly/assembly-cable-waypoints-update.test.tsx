import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblyCable } from "lib/components/primitive-components/AssemblyCable"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"

test("editing waypoints, anchor and axes updates the cable without detaching its ends", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board width={30} height={20} thickness={1.6} pcbX={70} routingDisabled>
        <connector
          name="J2"
          standard="jst_ph"
          pinCount={6}
          footprint="jst6_ph"
        />
      </board>
      <board
        name="CARRIER"
        width={42}
        height={42}
        thickness={1.6}
        pcbRotation={90}
        mountedTo="MOTOR.backface"
        routingDisabled
      />
      <assembly.motor name="MOTOR" standard="nema17" wireConnection="jst6_ph" />
      <assembly.cable
        name="HARNESS"
        from="MOTOR.wireside"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_end"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const before = structuredClone(circuit.db.cad_cable.list()[0]!)
  const automaticJson = structuredClone(circuit.getCircuitJson())
  const harness = circuit.selectOne(".HARNESS")
  if (!(harness instanceof AssemblyCable)) throw new Error("Missing cable")
  const waypoints = [{ x: 5, y: 30, z: 35 }]
  harness.setProps({
    ...harness.props,
    waypointAnchor: "end",
    waypointAxisOrientation: "board_at_start",
    waypoints,
  })
  await circuit.renderUntilSettled()
  const cables = circuit.db.cad_cable.list()
  expect(cables).toHaveLength(1)
  expect(cables[0]!.cad_cable_id).toBe(before.cad_cable_id)
  expect(cables[0]!.path[2]!.x).toBeCloseTo(40)
  expect(cables[0]!.path[2]!.y).toBeCloseTo(5)
  expect(cables[0]!.path[2]!.z).toBeCloseTo(41.8)
  expect(cables[0]!.path[0]).toEqual(before.path[0])
  expect(cables[0]!.path.at(-1)).toEqual(before.path.at(-1))
  expect(waypoints).toEqual([{ x: 5, y: 30, z: 35 }])
  await expectAssemblySnapshot(import.meta.path, {
    title: "Cable route update / fixed connectors and motor board axes",
    font: "alphabet",
    panels: [
      {
        title: "Automatic routing",
        code: `<board name="CARRIER" pcbRotation={90}
  mountedTo="MOTOR.backface" />
<assembly.motor name="MOTOR"
  standard="nema17"
  wireConnection="jst6_ph" />
<assembly.cable name="HARNESS"
  from="MOTOR.wireside" to=".J2" />`,
        annotation:
          "CARRIER is the motor's 90-degree board; J2's board is unrotated.",
        circuit: await withLocalNemaMesh(automaticJson),
        renderOptions: {
          poppygl: { camPos: [-130, 130, 175], lookAt: [-30, 20, 10], fov: 40 },
        },
      },
      {
        title: "Authored waypoint / end anchor and start board axes",
        code: `<assembly.cable name="HARNESS"
  from="MOTOR.wireside" to=".J2"
  waypointAnchor="end"
  waypointAxisOrientation="board_at_start"
  waypoints={[{ x: 5, y: 30, z: 35 }]} />`,
        annotation:
          "End anchor (70, 0, 6.8) + motor board offset (-30, 5, 35) mm.",
        circuit: await withLocalNemaMesh(circuit.getCircuitJson()),
        renderOptions: {
          poppygl: { camPos: [-130, 130, 175], lookAt: [-30, 20, 10], fov: 40 },
        },
      },
    ],
  })
  harness.setProps({ ...harness.props, waypoints: [] })
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_cable.list()[0]!.path).toEqual(before.path)
})
