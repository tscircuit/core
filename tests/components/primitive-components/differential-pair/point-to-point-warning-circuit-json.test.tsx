import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stores a property warning for a branched differential pair", (): void => {
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

  const pointToPointWarnings = circuit.db.source_property_ignored_warning.list()
  expect(pointToPointWarnings).toHaveLength(1)
  expect(pointToPointWarnings[0]).toMatchObject({
    type: "source_property_ignored_warning",
    error_type: "source_property_ignored_warning",
    property_name: "positiveConnection",
  })
  expect(pointToPointWarnings[0]?.source_component_id).toBeDefined()
  expect(pointToPointWarnings[0]?.message).toBe(
    'Differential pair "USB_DATA" positiveConnection references trace "DP_FROM_J1", which is ambiguous because it connects to 3 terminal pins: .J1 > .pin1, .TP1 > .pin1, and .U1 > .pin1.',
  )
})
