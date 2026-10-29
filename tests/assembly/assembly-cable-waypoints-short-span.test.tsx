import { expect, test } from "bun:test"
import { cad_cable } from "circuit-json"
import { vec3 } from "gl-matrix"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("waypoint curves preserve short spans between unequal-length segments", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board width={200} height={80} thickness={1.6} routingDisabled>
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
          pcbX={-80}
        />
        <connector
          name="J2"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
          pcbX={80}
        />
      </board>
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_start"
        waypoints={[
          { x: 20, y: 20, z: 30 },
          { x: 20, y: 20.00001, z: 30 },
          { x: 80, y: 20.00001, z: 30 },
        ]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cable = circuit.db.cad_cable.list()[0]!
  expect(cad_cable.parse(cable).path).toEqual(cable.path)
  const knot = cable.path.findIndex(
    (point) => point.x === -60 && point.y === 20.00001 && point.z === 36.8,
  )
  expect(knot).toBeGreaterThan(1)
  const previous = cable.path[knot - 1]!
  const current = cable.path[knot]!
  const next = cable.path[knot + 1]!
  const incoming = vec3.subtract(
    [0, 0, 0],
    [current.x, current.y, current.z],
    [previous.x, previous.y, previous.z],
  )
  const outgoing = vec3.subtract(
    [0, 0, 0],
    [next.x, next.y, next.z],
    [current.x, current.y, current.z],
  )
  expect(vec3.angle(incoming, outgoing)).toBeLessThan((20 * Math.PI) / 180)
})
