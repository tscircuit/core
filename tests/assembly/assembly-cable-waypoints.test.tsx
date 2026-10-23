import { expect, test } from "bun:test"
import { cad_cable } from "circuit-json"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("authored world waypoints preserve the connector exits and input points", async () => {
  const { circuit } = getTestFixture()
  const waypoints = [
    { x: -30, y: -40, z: 35 },
    { x: 30, y: -40, z: 35 },
  ]
  const authoredWaypoints = structuredClone(waypoints)
  circuit.add(
    <assembly.device>
      <board width={50} height={30} pcbX={15} pcbY={10} routingDisabled>
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
        waypoints={waypoints}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cable = cad_cable.parse(circuit.db.cad_cable.list()[0])
  expect(cable.path.slice(2, -2)).toEqual(authoredWaypoints)
  expect(cable.path[0]).toMatchObject({ x: 0, y: 10 })
  expect(cable.path.at(-1)).toMatchObject({ x: 30, y: 10 })
  expect(cable.path[1]!.z - cable.path[0]!.z).toBeCloseTo(0.1)
  expect(cable.path.at(-2)!.z - cable.path.at(-1)!.z).toBeCloseTo(0.1)
  expect(waypoints).toEqual(authoredWaypoints)
  expect(cable.from_source_component_id).not.toBe(cable.to_source_component_id)
})
