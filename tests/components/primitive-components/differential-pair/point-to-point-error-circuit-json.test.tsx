import { expect, test } from "bun:test"
import type { SourceDifferentialPairNotPointToPointError } from "lib/components/primitive-components/DifferentialPair_doInitialSourceDesignRuleChecks"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stores a Circuit JSON error and omits a branched differential pair from SRJ", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        name="USB_DATA"
        positiveConnection="DP_FROM_J1"
        negativeConnection="DM"
      />
      <chip name="J1" footprint="soic8" pcbX={-7} />
      <chip name="U1" footprint="soic8" pcbX={2} />
      <testpoint name="TP1" footprintVariant="pad" pcbX={7} />
      <trace name="DP_FROM_J1" from=".J1 > .pin1" to="net.DP" />
      <trace from="net.DP" to=".U1 > .pin1" />
      <trace from="net.DP" to=".TP1 > .pin1" />
      <trace name="DM" from=".J1 > .pin2" to=".U1 > .pin2" />
    </board>,
  )

  circuit.render()

  const pointToPointErrors = (
    circuit.getCircuitJson() as unknown as Array<{ type: string }>
  ).filter(
    (element) =>
      element.type === "source_differential_pair_not_point_to_point_error",
  ) as SourceDifferentialPairNotPointToPointError[]
  expect(pointToPointErrors).toHaveLength(1)
  expect(pointToPointErrors[0]).toMatchObject({
    type: "source_differential_pair_not_point_to_point_error",
    error_type: "source_differential_pair_not_point_to_point_error",
    is_fatal: true,
    differential_pair_name: "USB_DATA",
    connection_polarity: "positive",
    connection_selector: "DP_FROM_J1",
  })
  expect(pointToPointErrors[0]?.connected_source_port_ids).toHaveLength(3)
  expect(pointToPointErrors[0]?.source_net_id).toBeDefined()
  expect(pointToPointErrors[0]?.subcircuit_connectivity_map_key).toBeDefined()
  expect(pointToPointErrors[0]?.message).toBe(
    'Differential pair "USB_DATA" positiveConnection resolves to net.DP, which is not point-to-point. It connects to 3 pins: .J1 > .pin1, .TP1 > .pin1, and .U1 > .pin1. Remove the extra connection and prefer a pin selector such as positiveConnection=".J1 > .pin1".',
  )

  const boardSubcircuit = circuit.firstChild
  if (!boardSubcircuit) throw new Error("Expected a board subcircuit")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    subcircuitComponent: boardSubcircuit,
  })
  expect(simpleRouteJson.differentialPairs).toBeUndefined()
})
