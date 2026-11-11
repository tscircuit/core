import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects a multi-terminal hop before routing", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={18} routingDisabled schematicDisabled>
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <resistor name="RT" resistance={100} footprint="0402" pcbY={5} />
      <trace
        name="CK_P_TRUNK"
        path={[".U1 > .pin8", ".U2 > .pin1", ".RT > .pin1", "net.CK_P"]}
      />
      <trace name="CK_N_TRUNK" from=".U1 > .pin7" to=".U2 > .pin2" />
      <differentialpair
        maxLengthSkew={0.1}
        name="CK_PAIR"
        positiveConnection="CK_P_TRUNK"
        negativeConnection="CK_N_TRUNK"
      />
    </board>,
  )
  expect(() => circuit.render()).toThrow("exactly two distinct ports")
})
