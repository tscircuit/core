import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net classes create implicit nets and stay inside their subcircuit", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled>
      <subcircuit name="LEFT" pcbX={-5}>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <netclass name="Power" traceWidth="0.8mm" nets={["net.VCC"]} />
      </subcircuit>
      <subcircuit name="RIGHT" pcbX={5}>
        <resistor name="R2" resistance="1k" footprint="0402" />
        <netclass name="Power" traceWidth="0.2mm" nets={["net.VCC"]} />
      </subcircuit>
      <net name="VCC" />
      <netclass name="Unused" traceWidth="0.8mm" nets={[]} />
      <pcbnotetext text="LEFT VCC: 0.8 mm; RIGHT VCC: 0.2 mm; board VCC: default" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_net.list().map((net) => net.trace_width)).toEqual([
    0.8,
    0.2,
    undefined,
  ])
  expect(circuit.db.source_net_class.list()).toHaveLength(3)
  expect(circuit.db.source_net.list()[2].source_net_class_ids).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
