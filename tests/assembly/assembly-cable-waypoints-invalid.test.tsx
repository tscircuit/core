import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblyCable } from "lib/components/primitive-components/AssemblyCable"
import { resolveAssemblyCable } from "lib/components/primitive-components/resolve-assembly-cable"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("authored waypoints reject coincident points and reversing bends", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board width={50} height={30} routingDisabled>
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
          pcbX={-20}
        />
        <connector
          name="J2"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
          pcbX={20}
        />
      </board>
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to=".J2"
        waypointAnchor="start"
        waypointAxisOrientation="board_at_start"
        waypoints={[{ x: 20, y: 20, z: 30 }]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const harness = circuit.selectOne(".HARNESS")
  if (!(harness instanceof AssemblyCable)) throw new Error("Missing cable")
  harness.setProps({
    ...harness.props,
    waypoints: [
      { x: 0, y: 20, z: 30 },
      { x: 0, y: 20, z: 30 },
    ],
  })
  expect(() => resolveAssemblyCable(harness)).toThrow(
    'assembly.cable "HARNESS" waypoints must leave distinct consecutive path points',
  )
  harness.setProps({
    ...harness.props,
    waypoints: [
      { x: 0, y: 20, z: 30 },
      { x: 0, y: 30, z: 30 },
      { x: 0, y: 20, z: 30 },
    ],
  })
  expect(() => resolveAssemblyCable(harness)).toThrow(
    'assembly.cable "HARNESS" waypoints must not reverse direction',
  )
})
