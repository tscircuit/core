import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a restored classed module exposes its original root net to its parent", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled schematicDisabled>
      <netclass name="Power" traceWidth="0.8mm" nets={["net.VCC"]} />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin2" to="net.VCC" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { circuit: restored } = getTestFixture()
  restored.pcbRoutingDisabled = true
  restored.schematicDisabled = true
  restored.add(
    <board width={24} height={14}>
      <subcircuit
        name="MODULE"
        exposedNets={["VCC"]}
        circuitJson={JSON.parse(JSON.stringify(circuit.getCircuitJson()))}
      />
      <pcbnotetext pcbY={4} text="Exposed VCC retains Power at 0.8 mm" />
    </board>,
  )
  await restored.renderUntilSettled()
  expect(
    restored
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  const nets = restored.db.source_net.list()
  expect(nets).toHaveLength(2)
  const netIds = nets.map((net) => net.source_net_id)
  expect(
    restored.db.source_trace
      .list()
      .some((trace) =>
        netIds.every((id) => trace.connected_source_net_ids.includes(id)),
      ),
  ).toBe(true)
  expect(
    nets.find((net) => net.source_net_class_ids?.length)?.trace_width,
  ).toBe(0.8)
  await expect(restored).toMatchPcbSnapshot(import.meta.path)
})
