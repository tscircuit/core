import { expect, test } from "bun:test"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { SimpleRouteConnection } from "lib/utils/autorouting/SimpleRouteJson"
import { getDifferentialPairsForSimpleRouteJson } from "lib/utils/autorouting/getDifferentialPairsForSimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pairs differential SRJ segments by routing PCB group", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <differentialpair
        name="DDR_CLOCK"
        positiveConnection="CK_t"
        negativeConnection="CK_c"
        maxLengthSkew="50um"
        pcbTraceGap="100um"
        maxUncoupledLength="500um"
      />
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <trace name="CK_t" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="CK_c" from=".U1 > .pin2" to=".U2 > .pin2" />
    </board>,
  )

  circuit.render()

  const routingScope = circuit.firstChild
  if (!routingScope) throw new Error("Expected a board routing scope")
  const differentialPairs =
    routingScope.selectAll<DifferentialPair>("differentialpair")
  const positiveSourceTrace = circuit.db.source_trace.getWhere({ name: "CK_t" })
  const negativeSourceTrace = circuit.db.source_trace.getWhere({ name: "CK_c" })
  if (!positiveSourceTrace || !negativeSourceTrace) {
    throw new Error("Expected both DDR clock source traces")
  }

  const srjConnections: SimpleRouteConnection[] = [
    {
      name: "global_positive",
      source_trace_id: positiveSourceTrace.source_trace_id,
      pointsToConnect: [],
    },
    {
      name: "soc_positive",
      routingPcbGroupId: "pcb_group_soc_fanout",
      source_trace_id: positiveSourceTrace.source_trace_id,
      pointsToConnect: [],
    },
    {
      name: "dram_positive",
      routingPcbGroupId: "pcb_group_dram_fanout",
      source_trace_id: positiveSourceTrace.source_trace_id,
      pointsToConnect: [],
    },
    {
      name: "global_negative",
      source_trace_id: negativeSourceTrace.source_trace_id,
      pointsToConnect: [],
    },
    {
      name: "dram_negative",
      routingPcbGroupId: "pcb_group_dram_fanout",
      source_trace_id: negativeSourceTrace.source_trace_id,
      pointsToConnect: [],
    },
    {
      name: "soc_negative",
      routingPcbGroupId: "pcb_group_soc_fanout",
      source_trace_id: negativeSourceTrace.source_trace_id,
      pointsToConnect: [],
    },
  ]
  const getConstraints = (connections: SimpleRouteConnection[]) =>
    getDifferentialPairsForSimpleRouteJson({
      srjConnections: connections,
      differentialPairs,
      sourceTraces: circuit.db.source_trace.list(),
    })

  expect(getConstraints(srjConnections)).toEqual([
    {
      connectionNames: ["global_positive", "global_negative"],
      lengthTolerance: 0.05,
      traceGap: 0.1,
      maxUncoupledLength: 0.5,
    },
    {
      connectionNames: ["soc_positive", "soc_negative"],
      lengthTolerance: 0.05,
      traceGap: 0.1,
      maxUncoupledLength: 0.5,
    },
    {
      connectionNames: ["dram_positive", "dram_negative"],
      lengthTolerance: 0.05,
      traceGap: 0.1,
      maxUncoupledLength: 0.5,
    },
  ])

  expect(() =>
    getConstraints(
      srjConnections.filter(
        (connection) => connection.name !== "dram_negative",
      ),
    ),
  ).toThrow(
    /positive SRJ connection in routing PCB group "pcb_group_dram_fanout" without a matching negative SRJ connection/,
  )
  expect(() =>
    getConstraints(
      srjConnections.filter((connection) => connection.name !== "soc_positive"),
    ),
  ).toThrow(
    /negative SRJ connection in routing PCB group "pcb_group_soc_fanout" without a matching positive SRJ connection/,
  )
  expect(() =>
    getConstraints([
      ...srjConnections,
      {
        name: "duplicate_soc_positive",
        routingPcbGroupId: "pcb_group_soc_fanout",
        source_trace_id: positiveSourceTrace.source_trace_id,
        pointsToConnect: [],
      },
    ]),
  ).toThrow(
    /multiple SRJ connections in routing PCB group "pcb_group_soc_fanout"/,
  )
})
