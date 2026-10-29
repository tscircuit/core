import { expect, test } from "bun:test"
import { assembly } from "lib"
import { vec3 } from "gl-matrix"
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
  const waypoints = [
    { x: 44, y: 70, z: -3.5 },
    { x: 47, y: 70, z: -3.5 },
    { x: 52, y: 62, z: -0.5 },
    { x: 52, y: 30, z: 10 },
    { x: 36, y: 8, z: 16 },
    { x: 14, y: 0, z: 16 },
    { x: 3, y: 0, z: 13 },
    { x: 0, y: 0, z: 11 },
    { x: 0, y: 0, z: 10 },
  ]
  const originalWaypoints = structuredClone(waypoints)
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
  const path = cables[0]!.path
  expect(path).toContainEqual({
    x: expect.closeTo(40),
    y: expect.closeTo(52),
    z: expect.closeTo(16.8),
  })
  expect(path[0]).toEqual(before.path[0])
  expect(path.at(-1)).toEqual(before.path.at(-1))
  const motorLeadEnd = path.findIndex((point) => Math.abs(point.y - 44) < 1e-6)
  expect(motorLeadEnd).toBeGreaterThan(1)
  for (const point of path.slice(0, motorLeadEnd + 1)) {
    expect(point.x).toBeCloseTo(path[0]!.x)
    expect(point.z).toBeCloseTo(path[0]!.z)
  }
  const receiverLeadStart = path.findLastIndex(
    (point) => Math.abs(point.z - 16.8) < 1e-6,
  )
  expect(receiverLeadStart).toBeGreaterThan(motorLeadEnd)
  for (const point of path.slice(receiverLeadStart)) {
    expect(point.x).toBeCloseTo(path.at(-1)!.x)
    expect(point.y).toBeCloseTo(path.at(-1)!.y)
  }
  // 21.15 mm motor half-width, plus the six-wire bundle and clearance.
  const sideLaneBoundaryMm = 30
  for (let vertex = 1; vertex < path.length; vertex++) {
    const previous = path[vertex - 1]!
    const current = path[vertex]!
    expect(
      Math.min(previous.x, current.x) > sideLaneBoundaryMm ||
        Math.min(previous.y, current.y) > sideLaneBoundaryMm,
    ).toBe(true)
    if (vertex > 1) {
      const beforePrevious = path[vertex - 2]!
      const incoming = vec3.subtract(
        [0, 0, 0],
        [previous.x, previous.y, previous.z],
        [beforePrevious.x, beforePrevious.y, beforePrevious.z],
      )
      const outgoing = vec3.subtract(
        [0, 0, 0],
        [current.x, current.y, current.z],
        [previous.x, previous.y, previous.z],
      )
      expect(vec3.angle(incoming, outgoing)).toBeLessThan((15 * Math.PI) / 180)
    }
  }
  expect(waypoints).toEqual(originalWaypoints)
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
        title: "Smooth authored route / straight leads and motor clearance",
        code: `<assembly.cable name="HARNESS"
  from="MOTOR.wireside" to=".J2"
  waypointAnchor="end"
  waypointAxisOrientation="board_at_start"
  waypoints={[
    { x: 44, y: 70, z: -3.5 },
    { x: 47, y: 70, z: -3.5 },
    { x: 52, y: 62, z: -0.5 },
    { x: 52, y: 30, z: 10 },
    { x: 36, y: 8, z: 16 },
    { x: 14, y: 0, z: 16 },
    { x: 3, y: 0, z: 13 },
    { x: 0, y: 0, z: 11 },
    { x: 0, y: 0, z: 10 },
  ]} />`,
        annotation:
          "Smooth curves through the waypoints / straight plug leads / motor clearance.",
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
