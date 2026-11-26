import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("preserves a bus mean-deviation skew rule in source JSON", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled schematicDisabled>
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="D0" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="D1" from=".U1 > .pin2" to=".U2 > .pin2" />
      <bus
        name="DATA"
        connections={["D0", "D1"]}
        maxLengthSkew="0.5mm"
        lengthSkewReference="mean"
      />
    </board>,
  )
  circuit.render()
  expect(circuit.db.source_bus.getWhere({ name: "DATA" })).toMatchObject({
    max_length_skew: 0.5,
    length_skew_reference: "mean",
  })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    subcircuitComponent: circuit.firstChild!,
  })
  expect(simpleRouteJson.buses).toContainEqual(
    expect.objectContaining({ maxLengthSkew: 0.5, skewReference: "mean" }),
  )
})
