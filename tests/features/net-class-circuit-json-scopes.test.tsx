import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("loading classed Circuit JSON keeps same-name nets and classes in separate scopes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={14} routingDisabled schematicDisabled>
      <subcircuit name="LEFT" pcbX={-6}>
        <netclass name="Power" traceWidth="0.8mm" nets={["net.VCC"]} />
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
        <trace from=".R1 > .pin2" to="net.VCC" />
        <trace from=".R2 > .pin1" to="net.VCC" />
      </subcircuit>
      <subcircuit name="RIGHT" pcbX={6}>
        <netclass name="Power" traceWidth="0.2mm" nets={["net.VCC"]} />
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
        <trace from=".R1 > .pin2" to="net.VCC" />
        <trace from=".R2 > .pin1" to="net.VCC" />
      </subcircuit>
      <pcbnotetext pcbY={4} text="LEFT Power: 0.8 mm; RIGHT Power: 0.2 mm" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { circuit: restored } = getTestFixture()
  restored.pcbRoutingDisabled = true
  restored.schematicDisabled = true
  restored.add(
    <board width={30} height={14}>
      <subcircuit
        name="RESTORED"
        circuitJson={JSON.parse(JSON.stringify(circuit.getCircuitJson()))}
      />
    </board>,
  )
  await restored.renderUntilSettled()
  const nets = restored.db.source_net.list()
  expect(nets.map((net) => net.trace_width).sort()).toEqual([0.2, 0.8])
  const classes = restored.db.source_net_class.list()
  expect(new Set(classes.map((netClass) => netClass.subcircuit_id)).size).toBe(
    2,
  )
  for (const net of nets) {
    const netClass = restored.db.source_net_class.get(
      net.source_net_class_ids![0],
    )!
    expect(netClass.subcircuit_id).toBe(net.subcircuit_id)
    expect(netClass.trace_width).toBe(net.trace_width)
  }
  expect(restored.db.source_trace.list()).toHaveLength(4)
  expect(
    restored
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  await expect(restored).toMatchPcbSnapshot(import.meta.path)
})
