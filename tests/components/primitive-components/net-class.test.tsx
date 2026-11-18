import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("native net classes supply trace widths and retain membership", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="24mm" height="14mm" schMaxTraceDistance={100}>
      <netclass name="Power" traceWidth="0.8mm" nets={["net.VCC"]} />
      <net name="VCC" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".R2 > .pin1" to="net.VCC" />
      <pcbnotetext pcbY={4} text="Power class: VCC at 0.8 mm" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_net.list().find((net) => net.name === "VCC")?.trace_width,
  ).toBe(0.8)
  const netClass = circuit.db.source_net_class.list()[0]
  expect(netClass.name).toBe("Power")
  expect(
    circuit.db.source_net.list().find((net) => net.name === "VCC")
      ?.source_net_class_ids,
  ).toEqual([netClass.source_net_class_id])
  const routedWidths = circuit.db.pcb_trace
    .list()
    .flatMap((trace) => trace.route)
    .filter((point) => point.route_type === "wire")
    .map((point) => point.width)
  expect(routedWidths).toContain(0.8)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
