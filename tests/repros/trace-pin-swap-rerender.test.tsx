import { expect, test } from "bun:test"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getSourceTraceConnections = (
  circuit: ReturnType<typeof getTestFixture>["circuit"],
) =>
  circuit.db.source_trace.list().map((sourceTrace) => ({
    name: sourceTrace.name,
    ports: sourceTrace.connected_source_port_ids.map((sourcePortId) => {
      const port = circuit.db.source_port.get(sourcePortId)!
      const component = circuit.db.source_component.get(
        port.source_component_id!,
      )!
      return `${component.name}.${port.name}`
    }),
  }))

test("swapping trace destinations via setProps updates source connectivity on rerender", async () => {
  const { circuit } = getTestFixture()
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
      <trace name="DATA_A" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="DATA_B" from=".U1 > .pin2" to=".U2 > .pin2" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const traceA = circuit.selectOne('trace[name="DATA_A"]') as Trace
  const traceB = circuit.selectOne('trace[name="DATA_B"]') as Trace
  traceA.setProps({ ...traceA.props, to: ".U2 > .pin2" })
  traceB.setProps({ ...traceB.props, to: ".U2 > .pin1" })
  await circuit.renderUntilSettled()

  const { circuit: freshCircuit } = getTestFixture()
  freshCircuit.add(
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
      <trace name="DATA_A" from=".U1 > .pin1" to=".U2 > .pin2" />
      <trace name="DATA_B" from=".U1 > .pin2" to=".U2 > .pin1" />
    </board>,
  )
  await freshCircuit.renderUntilSettled()

  expect(getSourceTraceConnections(circuit)).toEqual(
    getSourceTraceConnections(freshCircuit),
  )
  expect(
    circuit.db.source_port.list().map((port) => ({
      name: port.name,
      key: port.subcircuit_connectivity_map_key,
    })),
  ).toEqual(
    freshCircuit.db.source_port.list().map((port) => ({
      name: port.name,
      key: port.subcircuit_connectivity_map_key,
    })),
  )
  expect(freshCircuit).toMatchSchematicSnapshot(import.meta.path)
})
