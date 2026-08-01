import { expect, test } from "bun:test"
import {
  getFullConnectivityMapFromCircuitJson,
  getSourcePortConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via connectsTo joins a component port to a net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{ pin1: ["GND"] }}
        pinAttributes={{ pin1: { requiresGround: true } }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0}
              width="2mm"
              height="2mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <via
        name="VIA_GND"
        pcbX={0}
        pcbY={0}
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        connectsTo={[".U1 > .GND", "net.GND"]}
      />
      <pcbnotetext
        pcbY="-3mm"
        fontSize="0.45mm"
        text="VIA CONNECTS U1.GND TO GND"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourcePort = circuit.db.source_port
    .list()
    .find((port) => port.port_hints?.includes("GND"))
  const sourceNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "GND")
  const sourceTrace = circuit.db.source_trace.list()[0]
  const sourceVia = circuit.db.source_manually_placed_via.list()[0]
  const pcbPad = circuit.db.pcb_smtpad.list()[0]
  const pcbVia = circuit.db.pcb_via.list()[0]
  const sourceConnectivityMap =
    getSourcePortConnectivityMapFromCircuitJson(circuitJson)
  const fullConnectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  expect(sourcePort).toBeDefined()
  expect(sourceNet).toBeDefined()
  expect(sourceTrace).toBeDefined()
  expect(sourceVia.source_trace_id).toBe(sourceTrace.source_trace_id)
  expect(sourceVia.source_net_id).toBe(sourceNet!.source_net_id)
  expect(pcbPad).toBeDefined()
  expect(pcbVia).toBeDefined()
  expect(pcbVia.source_trace_id).toBe(sourceTrace.source_trace_id)
  // Retain the legacy field until all connectivity consumers understand
  // pcb_via.source_trace_id.
  expect(pcbVia.pcb_trace_id).toBe(sourceTrace.source_trace_id)
  expect(
    sourceConnectivityMap.areIdsConnected(
      sourcePort!.source_port_id,
      sourceNet!.source_net_id,
    ),
  ).toBe(true)
  expect(
    fullConnectivityMap.areAllIdsConnected([
      sourcePort!.source_port_id,
      sourceNet!.source_net_id,
      pcbPad.pcb_smtpad_id,
      pcbVia.pcb_via_id,
    ]),
  ).toBe(true)
  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
