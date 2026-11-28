import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { circuitJsonToSchematicSvg } from "circuit-to-svg"
import "lib/register-catalogue"

async function createCircuit(swapped = false) {
  const circuit = new RootCircuit()
  circuit.add(
    <board width={20} height={12} routingDisabled>
      <chip
        name="U1"
        footprint="soic4"
        pinLabels={{ pin1: "A", pin2: "B" }}
        pcbX={-4}
        schX={-3}
      />
      <chip
        name="U2"
        footprint="soic4"
        pinLabels={{ pin1: "A", pin2: "B" }}
        pcbX={4}
        schX={3}
      />
      <trace
        name="DATA_A"
        from=".U1 > .pin1"
        to={swapped ? ".U2 > .pin2" : ".U2 > .pin1"}
      />
      <trace
        name="DATA_B"
        from=".U1 > .pin2"
        to={swapped ? ".U2 > .pin1" : ".U2 > .pin2"}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

function sourceConnections(circuit: RootCircuit) {
  return circuit.db.source_trace.list().map((trace) => ({
    name: trace.name,
    ports: trace.connected_source_port_ids.map((sourcePortId) => {
      const port = circuit.db.source_port.get(sourcePortId)!
      const component = circuit.db.source_component.get(port.source_component_id)!
      return `${component.name}.${port.name}`
    }),
  }))
}

// Known regression: use normal test() once incremental trace updates are fixed.
test.failing("swapping trace destinations rerenders the same source connections as a fresh circuit", async () => {
  const circuit = await createCircuit()
  const initialConnections = sourceConnections(circuit)
  for (const [name, to] of [
    ["DATA_A", ".U2 > .pin2"],
    ["DATA_B", ".U2 > .pin1"],
  ]) {
    const trace = circuit.selectOne(`trace[name="${name}"]`) as Trace
    trace.setProps({ ...trace.props, to })
  }
  await circuit.renderUntilSettled()
  const freshCircuit = await createCircuit(true)
  // Snapshot the correct fresh build: the labeled U2 A/B pins are exchanged.
  await expect(
    circuitJsonToSchematicSvg(freshCircuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
  // An unchanged incremental render cannot pass this deliberately changed control.
  expect(sourceConnections(freshCircuit)).not.toEqual(initialConnections)
  expect(sourceConnections(circuit)).toEqual(sourceConnections(freshCircuit))
})
