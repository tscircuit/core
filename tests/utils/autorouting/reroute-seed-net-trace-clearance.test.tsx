import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { getExistingSimplifiedPcbTracesForReroute } from "lib/components/primitive-components/Group/region-replacement"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reroute seed traces keep their net clearance", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={12} routingDisabled schematicDisabled>
      <net name="RF" minTraceClearance={0.4} connectsTo="R1.pin1" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={-6} pcbY={4} />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={6} pcbY={4} />
      <trace from="R1.pin1" to="R2.pin1" pcbStraightLine />
      <trace from="R3.pin1" to="R4.pin1" pcbStraightLine />
    </board>,
  )
  await circuit.renderUntilSettled()

  const rfSourcePortId = (circuit.selectOne(".R1 > .pin1") as Port)
    .source_port_id!
  const isRfTrace = (sourceTraceId: string | undefined) =>
    Boolean(
      sourceTraceId &&
        circuit.db.source_trace
          .get(sourceTraceId)
          ?.connected_source_port_ids.includes(rfSourcePortId),
    )

  const traces = getExistingSimplifiedPcbTracesForReroute(
    circuit.firstChild as Group<any>,
  )
  expect(traces).toHaveLength(2)
  const rfTraces = traces.filter((trace) =>
    isRfTrace(circuit.db.pcb_trace.get(trace.pcb_trace_id)?.source_trace_id),
  )
  const otherTraces = traces.filter((trace) => !rfTraces.includes(trace))
  expect(rfTraces).toHaveLength(1)
  expect(rfTraces[0].minTraceClearance).toBe(0.4)
  expect(otherTraces).toHaveLength(1)
  expect(otherTraces[0]).not.toHaveProperty("minTraceClearance")
  // Seed conversion annotates SRJ copies only, not Circuit JSON.
  for (const pcbTrace of circuit.db.pcb_trace.list()) {
    expect(pcbTrace).not.toHaveProperty("minTraceClearance")
  }
})
