import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("boardless child inherits parent and sibling constraints but not another board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <group name="root" subcircuit width={30} height={20} routingDisabled>
      <keepout shape="circle" radius={2} allowTraces />
      <group name="child" subcircuit>
        <resistor name="R1" resistance="1k" footprint="1206" />
      </group>
    </group>,
  )
  circuit.add(
    <group name="other" subcircuit routingDisabled>
      <keepout shape="circle" radius={7} allowTraces />
    </group>,
  )
  circuit.add(
    <board name="unrelated" width={40} height={40} routingDisabled>
      <keepout shape="circle" radius={9} allowTraces />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const name of ["root", "child"]) {
    const group = circuit.db.source_group.list().find((g) => g.name === name)!
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(),
      subcircuit_id: group.subcircuit_id,
    })
    expect(simpleRouteJson.viaKeepouts).toEqual([
      { shape: "circle", center: { x: 0, y: 0 }, radius: 2, layers: ["top"] },
      { shape: "circle", center: { x: 0, y: 0 }, radius: 7, layers: ["top"] },
    ])
  }
})
