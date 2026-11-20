import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("local skew walks the route points a teardrop adds, because it runs after teardrops", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={22} height={8} routeRemaining={false}>
      <testpoint
        name="P1"
        footprintVariant="pad"
        padDiameter={0.8}
        doNotPlace
        pcbX={-9}
        pcbY={0.5}
      />
      <testpoint
        name="P2"
        footprintVariant="pad"
        doNotPlace
        pcbX={9}
        pcbY={0.5}
      />
      <testpoint
        name="N1"
        footprintVariant="pad"
        doNotPlace
        pcbX={-9}
        pcbY={-0.5}
      />
      <testpoint
        name="N2"
        footprintVariant="pad"
        doNotPlace
        pcbX={9}
        pcbY={-0.5}
      />
      <trace
        name="DP"
        from="P1.1"
        to="P2.1"
        thickness={0.15}
        pcbPath={[]}
        pcbTeardropStart
      />
      <trace name="DN" from="N1.1" to="N2.1" thickness={0.15} pcbPath={[]} />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap={0.85}
      />
      <pcbnotetext
        pcbY={2}
        fontSize={0.35}
        text="DP has a teardrop at its source pad"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const [localSkew] = circuit.db.pcb_differential_pair_local_skew.list()
  const pcbTraceId = localSkew.walks.positive[0].pcb_trace_id
  expect(circuit.db.pcb_trace.get(pcbTraceId)?.route).toHaveLength(3)
  expect(localSkew.walks.positive).toEqual([
    {
      pcb_trace_id: pcbTraceId,
      edge_index: 0,
      reverse: false,
    },
    {
      pcb_trace_id: pcbTraceId,
      edge_index: 1,
      reverse: false,
    },
  ])
})
