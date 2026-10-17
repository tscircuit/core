import { expect, test } from "bun:test"
import {
  PcbConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("DRC must report separate copper islands on the same GND net", async () => {
  let disconnectedPortErrors = 0

  for (const bridge of [false, true]) {
    const { circuit } = getTestFixture()
    // Board-world points in mm: +X right, +Y up. Two local copper groups
    // intentionally remain split, so routing DRC must detect the missing join.
    circuit.add(
      <board width={20} height={10} schematicDisabled routeRemaining={false}>
        {(
          [
            ["A", -6],
            ["B", -2],
            ["C", 2],
            ["D", 6],
          ] as const
        ).map(([name, pcbX]) => (
          <chip
            key={name}
            name={name}
            pcbX={pcbX}
            footprint={
              <footprint>
                <smtpad portHints={["1"]} width={1} height={1} shape="rect" />
              </footprint>
            }
          />
        ))}
        <net name="GND" connectsTo={["A.1", "B.1", "C.1", "D.1"]} />
        <trace from="A.1" to="B.1" pcbPath={[]} thickness={0.3} />
        <trace from="C.1" to="D.1" pcbPath={[]} thickness={0.3} />
        {bridge && <trace from="B.1" to="C.1" pcbPath={[]} thickness={0.3} />}
        <pcbnotetext
          pcbX={0}
          pcbY={3.8}
          anchorAlignment="center"
          text="Repro: disconnected copper islands on one GND net"
          fontSize={0.5}
        />
        <pcbnotetext
          pcbX={0}
          pcbY={2.4}
          text={
            bridge
              ? "Bridge added: one copper group"
              : "Missing bridge: two copper groups"
          }
          fontSize={0.45}
        />
        <pcbnotetext pcbX={-4} pcbY={-1.5} text="GND: A + B" fontSize={0.45} />
        <pcbnotetext pcbX={4} pcbY={-1.5} text="GND: C + D" fontSize={0.45} />
        <pcbnotetext
          pcbX={0}
          pcbY={-3.4}
          text={
            bridge
              ? "Actual: no connectivity error; all pads connected"
              : "Actual: no connectivity error (missing island check)"
          }
          fontSize={0.45}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    await expect(circuit).toMatchPcbSnapshot(
      `${import.meta.path.replace(".test.tsx", "")}-${bridge ? "bridged" : "disconnected"}`,
      { showDebugObjects: false },
    )

    const circuitJson = circuit.getCircuitJson()
    const traces = circuit.db.pcb_trace.list()
    const copper = new PcbConnectivityMap(circuitJson)
    expect(traces).toHaveLength(bridge ? 3 : 2)
    expect(
      getFullConnectivityMapFromCircuitJson(circuitJson).areAllIdsConnected(
        circuit.db.pcb_port.list().map((port) => port.pcb_port_id),
      ),
    ).toBe(true)
    expect(
      copper.areTracesConnected(
        traces[0]!.pcb_trace_id,
        traces[1]!.pcb_trace_id,
      ),
    ).toBe(bridge)
    expect(
      circuit.db.pcb_port
        .list()
        .every(
          (port) =>
            copper.getAllTracesConnectedToPort(port.pcb_port_id).length > 0,
        ),
    ).toBe(true)

    if (bridge) {
      expect(
        circuitJson.filter((element) => element.type.endsWith("_error")),
      ).toHaveLength(0)
    } else {
      disconnectedPortErrors =
        circuit.db.pcb_port_not_connected_error.list().length
    }
  }

  // Current DRC accepts each pad's local trace without requiring the other
  // GND copper island to be reachable. Both snapshots and the control run first.
  expect(disconnectedPortErrors).toBeGreaterThan(0)
})
