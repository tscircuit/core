import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("does not warn for a two-terminal conductor split through a source net", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        name="USB_DATA"
        positiveConnection=".J1 > .pin1"
        negativeConnection="DM"
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
    circuit.db.source_property_ignored_warning
      .list()
      .filter(
        (warning) =>
          warning.property_name === "positiveConnection" ||
          warning.property_name === "negativeConnection",
      ),
  ).toEqual([])
})
