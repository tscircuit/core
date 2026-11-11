import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("equivalent port and net selected pairs export the same source bus membership", () => {
  for (const selection of ["port", "net"]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={24} height={16} schematicDisabled routingDisabled>
        <chip
          name="A"
          footprint={differentialPairPathPads()}
          pcbX={-6}
          connections={{ pin1: "net.P", pin2: "net.N" }}
        />
        <chip
          name="B"
          footprint={differentialPairPathPads()}
          pcbX={6}
          connections={{ pin1: "net.P", pin2: "net.N" }}
        />
        <differentialpair
          name="PAIR"
          positiveConnection={selection === "net" ? "net.P" : ".A > .pin1"}
          negativeConnection={selection === "net" ? "net.N" : ".A > .pin2"}
          targetDifferentialImpedance={90}
          pcbTraceGap={0.15}
          maxLengthSkew={0.2}
          maxUncoupledLength={0.5}
        />
      </board>,
    )
    circuit.render()
    const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    })
    const traces = circuit.db.source_trace.list()
    const positiveTraceIds = traces
      .filter((trace) =>
        trace.connected_source_net_ids.includes(
          circuit.db.source_net.getWhere({ name: "P" })!.source_net_id,
        ),
      )
      .map((trace) => trace.source_trace_id)
    const negativeTraceIds = traces
      .filter((trace) =>
        trace.connected_source_net_ids.includes(
          circuit.db.source_net.getWhere({ name: "N" })!.source_net_id,
        ),
      )
      .map((trace) => trace.source_trace_id)
    expect(circuit.db.source_bus.list()).toEqual([
      expect.objectContaining({
        source_trace_ids: [...positiveTraceIds, ...negativeTraceIds],
        target_differential_impedance: 90,
        max_length_skew: 0.2,
        differential_pair: {
          positive_source_trace_id: positiveTraceIds[0],
          negative_source_trace_id: negativeTraceIds[0],
          trace_gap: 0.15,
          max_uncoupled_length: 0.5,
        },
      }),
    ])
    expect(circuit.db.source_property_ignored_warning.list()).toEqual([])
    expect(srj.differentialPairs).toHaveLength(1)
  }
})
