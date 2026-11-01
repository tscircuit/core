import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblyCable } from "lib/components/primitive-components/AssemblyCable"
import { resolveAssemblyCable } from "lib/components/primitive-components/resolve-assembly-cable"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone motor waypoints require a board only at the selected endpoint", async () => {
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
      <assembly.motor name="MOTOR" standard="nema17" wireConnection="jst6_ph" />
      <assembly.cable
        name="HARNESS"
        from="MOTOR.wireside"
        to=".J2"
        waypointAnchor="end"
        waypointAxisOrientation="board_at_end"
        waypoints={[{ x: -20, y: 30, z: 20 }]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_cable.list()[0]!.path).toContainEqual({
    x: expect.closeTo(50),
    y: expect.closeTo(30),
    z: expect.closeTo(26.8),
  })
  const harness = circuit.selectOne(".HARNESS")
  if (!(harness instanceof AssemblyCable)) throw new Error("Missing cable")
  harness.setProps({
    ...harness.props,
    waypointAxisOrientation: "board_at_start",
  })
  expect(() => resolveAssemblyCable(harness)).toThrow(
    'assembly.cable "HARNESS" endpoint "MOTOR.wireside" has no board for waypointAxisOrientation="board_at_start"',
  )
})
