import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduces ignored net nominal trace width", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="20mm"
      height="12mm"
      autorouter="auto_local"
      minTraceWidth="0.2mm"
    >
      <net name="VCC" isPowerNet nominalTraceWidth="0.4mm" />
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} />
      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R2 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
      <pcbnotetext
        text="VCC requested: 0.4 mm; board minimum: 0.2 mm"
        pcbY={4}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const sourceNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "VCC")!
  expect(sourceNet.trace_width).toBeUndefined()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit
      .getCircuitJson()
      .filter((element) => element.type !== "pcb_trace"),
  })
  const connection = simpleRouteJson.connections.find(
    (connection) => connection.name === sourceNet.source_net_id,
  )!
  expect(connection.nominalTraceWidth).toBe(0.2)
  const sourceTraceIds = circuit.db.source_trace
    .list()
    .filter((trace) =>
      trace.connected_source_net_ids?.includes(sourceNet.source_net_id),
    )
    .map((trace) => trace.source_trace_id)
  const netTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) => sourceTraceIds.includes(trace.source_trace_id!))
  expect(netTraces.length).toBeGreaterThan(0)
  for (const trace of netTraces) {
    for (const point of trace.route) {
      if (point.route_type === "wire") expect(point.width).toBe(0.2)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
