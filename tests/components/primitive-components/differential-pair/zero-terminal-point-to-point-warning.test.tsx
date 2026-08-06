import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stores a warning for a differential-pair connection with no terminal pins", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        name="USB_DATA"
        positiveConnection="DP_EMPTY"
        negativeConnection="DM"
      />
      <chip name="J1" footprint="soic8" pcbX={-6} />
      <chip name="U1" footprint="soic8" pcbX={6} />
      <trace name="DP_EMPTY" from="net.DP" to="net.DP" />
      <trace name="DM" from=".J1 > .pin2" to=".U1 > .pin2" />
    </board>,
  )

  circuit.render()

  const warning = circuit.db.source_property_ignored_warning.getWhere({
    property_name: "positiveConnection",
  })
  expect(warning).toMatchObject({
    type: "source_property_ignored_warning",
    source_component_id: "",
    error_type: "source_property_ignored_warning",
    property_name: "positiveConnection",
    drc_category: "netlist",
  })
  expect(warning?.message).toBe(
    'Differential pair "USB_DATA" positiveConnection="DP_EMPTY" is not point-to-point: expected exactly 2 terminal pins, found 0.',
  )
})
