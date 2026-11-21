import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("standalone subcircuit retains its own via keepout", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <group name="standalone" subcircuit width={30} height={20} routingDisabled>
      <keepout
        shape="rect"
        width={8}
        height={6}
        allowTraces
        allowPlacements
        layers={["top", "bottom"]}
      />
      <resistor name="R1" resistance="1k" footprint="1206" pcbX={-9} />
      <resistor name="R2" resistance="1k" footprint="1206" pcbX={9} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </group>,
  )
  await circuit.renderUntilSettled()
  const group = circuit.db.source_group
    .list()
    .find((g) => g.name === "standalone")!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    subcircuit_id: group.subcircuit_id,
  })
  expect(simpleRouteJson.viaKeepouts).toHaveLength(1)
})
