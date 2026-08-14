import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace ending on a net-connected via should inherit the via net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" layers={2}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={2}
        pinAttributes={{ pin2: { doNotConnect: true } }}
      />
      <via
        name="VIA_GND"
        pcbX={0}
        pcbY={0}
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        fromLayer="top"
        toLayer="bottom"
        connectsTo="net.GND"
      />
      <trace name="R1_TO_GND" from=".R1 > .pin1" to=".VIA_GND > .top" />
      <pcbnotetext
        pcbY={-2.7}
        fontSize={0.32}
        text="EXPECTED: TRACE AND VIA SHARE GND"
      />
      <pcbnotetext
        pcbY={-3.3}
        fontSize={0.32}
        text="FIXED: NO FALSE OVERLAP DRC"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
  })

  const sourceNet = circuit.db.source_net.list()[0]!
  const sourceTrace = circuit.db.source_trace.list()[0]!
  const sourceVia = circuit.db.source_manually_placed_via.list()[0]!
  const pcbVia = circuit.db.pcb_via.list()[0]!
  const fullConnectivityMap = getFullConnectivityMapFromCircuitJson(
    circuit.getCircuitJson(),
  )

  expect({
    sourceViaUsesGnd: sourceVia.source_net_id === sourceNet.source_net_id,
    sourceTraceUsesGnd: sourceTrace.connected_source_net_ids.includes(
      sourceNet.source_net_id,
    ),
    sourceTraceKeyMatchesGnd:
      sourceTrace.subcircuit_connectivity_map_key ===
      sourceNet.subcircuit_connectivity_map_key,
    pcbViaKeyMatchesGnd:
      pcbVia.subcircuit_connectivity_map_key ===
      sourceNet.subcircuit_connectivity_map_key,
    traceViaAndNetAreConnected: fullConnectivityMap.areAllIdsConnected([
      sourceTrace.source_trace_id,
      sourceNet.source_net_id,
      pcbVia.pcb_via_id,
    ]),
    traceErrors: circuit.db.pcb_trace_error.list(),
  }).toEqual({
    sourceViaUsesGnd: true,
    sourceTraceUsesGnd: true,
    sourceTraceKeyMatchesGnd: true,
    pcbViaKeyMatchesGnd: true,
    traceViaAndNetAreConnected: true,
    traceErrors: [],
  })
})
