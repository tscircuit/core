import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("does not warn for a two-terminal conductor split through a source net", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        maxLengthSkew={0.1}
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

  const exportedPair = circuit.db.source_bus.getWhere({ name: "USB_DATA" })!
  expect(exportedPair.source_trace_ids).toHaveLength(2)
  const canonical = circuit.db.source_trace.get(
    exportedPair.source_trace_ids[0]!,
  )!
  expect(canonical.connected_source_port_ids).toHaveLength(2)
  expect(exportedPair.differential_pair).toEqual({
    positive_source_trace_ids: [canonical.source_trace_id],
    negative_source_trace_ids: [
      circuit.db.source_trace.getWhere({ name: "DM" })!.source_trace_id,
    ],
  })

  expect(
    circuit.db.source_property_ignored_warning
      .list()
      .filter(
        (warning) =>
          warning.property_name === "positiveConnection" ||
          warning.property_name === "negativeConnection",
      ),
  ).toEqual([])

  const board = circuit.firstChild
  if (!board) throw new Error("Expected a board")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: board,
  })
  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        [canonical.source_trace_id],
        [circuit.db.source_trace.getWhere({ name: "DM" })!.source_trace_id],
      ],
      maxLengthSkewMm: 0.1,
    },
  ])
})
