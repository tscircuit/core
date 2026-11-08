import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects a merged branched net as a replacement for a named differential trunk", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={18} routingDisabled schematicDisabled>
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <resistor name="RT" resistance={100} footprint="0402" pcbY={5} />
      <trace
        name="CK_P_TRUNK"
        path={[".U1 > .pin8", ".U2 > .pin1", "net.CK_P"]}
      />
      <trace name="CK_P_TAP" from="net.CK_P" to=".RT > .pin1" />
      <trace name="CK_N_TRUNK" from=".U1 > .pin7" to=".U2 > .pin2" />
      <differentialpair
        name="CK_PAIR"
        positiveConnection="CK_P_TRUNK"
        negativeConnection="CK_N_TRUNK"
      />
    </board>,
  )
  circuit.render()
  const trunk = circuit.db.source_trace.getWhere({ name: "CK_P_TRUNK" })!
  expect(trunk.connected_source_port_ids).toHaveLength(2)
  expect(trunk.connected_source_net_ids).toHaveLength(1)
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    }),
  ).toThrow(
    'Could not find an SRJ connection for trace name or port selector "CK_P_TRUNK"',
  )
})
