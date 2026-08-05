import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("accepts a two-terminal differential conductor split through a source net", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        name="USB_DATA"
        positiveConnection=".J1 > .pin1"
        negativeConnection="DM"
        maxLengthSkew={0.05}
      />
      <chip name="J1" footprint="soic8" pcbX={-6} />
      <chip name="U1" footprint="soic8" pcbX={6} />
      <trace name="DP_FROM_J1" from=".J1 > .pin1" to="net.DP" />
      <trace name="DP_TO_U1" from="net.DP" to=".U1 > .pin1" />
      <trace name="DM" from=".J1 > .pin2" to=".U1 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(
    (circuit.getCircuitJson() as unknown as Array<{ type: string }>).filter(
      (element) =>
        element.type === "source_differential_pair_not_point_to_point_error",
    ),
  ).toEqual([])

  const boardSubcircuit = circuit.firstChild
  if (!boardSubcircuit) throw new Error("Expected a board subcircuit")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    subcircuitComponent: boardSubcircuit,
  })
  const dpSourceNet = circuit.db.source_net.getWhere({ name: "DP" })
  const dmSourceTrace = circuit.db.source_trace.getWhere({ name: "DM" })
  if (!dpSourceNet || !dmSourceTrace) {
    throw new Error("Expected DP source net and DM source trace")
  }

  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        dpSourceNet.source_net_id,
        dmSourceTrace.source_trace_id,
      ],
      lengthTolerance: 0.05,
    },
  ])
})
