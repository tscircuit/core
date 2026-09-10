import { expect, test } from "bun:test"
import {
  getFullConnectivityMapFromCircuitJson,
  PcbConnectivityMap,
} from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Repro only: do not replace the net-to-net trace with explicit pin anchors.
// Remove .failing once the parent net-to-net bridge is physically routed.
test.failing(
  "parent net-to-net trace should join routed child subcircuits",
  async () => {
    const { circuit } = getTestFixture({
      platform: { schematicDisabled: true },
    })
    circuit.add(
      <board width={40} height={20} autorouter="auto">
        <subcircuit name="LEFT" pcbX={-10} schX={-6} autorouter="auto">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={-2}
            schX={-1.5}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="0402"
            pcbX={2}
            schX={1.5}
          />
          <net name="BUS" />
          <trace from=".R1 .pin2" to="net.BUS" />
          <trace from=".R2 .pin1" to="net.BUS" />
        </subcircuit>
        <subcircuit name="RIGHT" pcbX={10} schX={6} autorouter="auto">
          <resistor
            name="R3"
            resistance="1k"
            footprint="0402"
            pcbX={-2}
            schX={-1.5}
          />
          <resistor
            name="R4"
            resistance="1k"
            footprint="0402"
            pcbX={2}
            schX={1.5}
          />
          <net name="BUS" />
          <trace from=".R3 .pin2" to="net.BUS" />
          <trace from=".R4 .pin1" to="net.BUS" />
        </subcircuit>
        <trace from=".LEFT net.BUS" to=".RIGHT net.BUS" />
        <pcbnotetext pcbX={-10} pcbY={2} fontSize={0.6} text="LEFT / BUS" />
        <pcbnotetext pcbX={10} pcbY={2} fontSize={0.6} text="RIGHT / BUS" />
        <pcbnotetext
          pcbX={0}
          pcbY={6}
          fontSize={0.55}
          text="Expected: copper joins LEFT.BUS to RIGHT.BUS"
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const pcbPortFor = (componentName: string, pinName: string) => {
      const component = circuit.db.source_component
        .list()
        .find((c) => c.name === componentName)!
      const sourcePort = circuit.db.source_port
        .list()
        .find(
          (p) =>
            p.source_component_id === component.source_component_id &&
            p.name === pinName,
        )!
      return circuit.db.pcb_port
        .list()
        .find((p) => p.source_port_id === sourcePort.source_port_id)!
    }
    const leftPort = pcbPortFor("R2", "pin1")
    const rightPort = pcbPortFor("R3", "pin2")
    const circuitJson = circuit.getCircuitJson()
    const logical = getFullConnectivityMapFromCircuitJson(circuitJson)
    expect(
      logical.areIdsConnected(leftPort.pcb_port_id, rightPort.pcb_port_id),
    ).toBe(true)

    const physical = new PcbConnectivityMap(circuitJson)
    const leftTraces = physical.getAllTracesConnectedToPort(
      leftPort.pcb_port_id,
    )
    const rightTraces = physical.getAllTracesConnectedToPort(
      rightPort.pcb_port_id,
    )
    expect(leftTraces.length).toBeGreaterThan(0)
    expect(rightTraces.length).toBeGreaterThan(0)

    // Both child nets have copper. The missing parent bridge is the failure:
    // at least one physical copper network must reach terminals in both children.
    expect(
      leftTraces.some((leftTrace) =>
        rightTraces.some((rightTrace) =>
          physical.areTracesConnected(
            leftTrace.pcb_trace_id,
            rightTrace.pcb_trace_id,
          ),
        ),
      ),
    ).toBe(true)
  },
)
