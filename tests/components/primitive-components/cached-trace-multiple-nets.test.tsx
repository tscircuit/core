import { expect, test } from "bun:test"
import type { PcbRouteCache } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CacheBoard = ({ cache }: { cache?: PcbRouteCache }) => (
  <board width="12mm" height="10mm" pcbRouteCache={cache}>
    <resistor name="R1" resistance="10k" footprint="0402" pcbX={-3} pcbY={2} />
    <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={2} />
    <resistor name="R3" resistance="10k" footprint="0402" pcbX={-3} pcbY={-2} />
    <resistor name="R4" resistance="10k" footprint="0402" pcbX={3} pcbY={-2} />
    <trace
      from=".R1 > .pin2"
      to=".R2 > .pin1"
      thickness={0.2}
      pcbPath={cache ? undefined : [{ x: 3, y: 1 }]}
    />
    <trace
      from=".R3 > .pin2"
      to=".R4 > .pin1"
      thickness={0.3}
      pcbPath={cache ? undefined : [{ x: 3, y: -1 }]}
    />
    <pcbnotetext
      text="Cached nets stay separate"
      pcbX={0}
      pcbY={0}
      fontSize={0.4}
    />
  </board>
)

test("replaying a cache preserves routes for distinct source traces", async () => {
  const { circuit: original } = getTestFixture()
  original.add(<CacheBoard />)
  await original.renderUntilSettled()
  const pcbTraces = original.db.pcb_trace.list()
  const sourceTraces = original.db.source_trace.list()
  expect(pcbTraces).toHaveLength(2)
  expect(sourceTraces).toHaveLength(2)
  expect(pcbTraces.map((trace) => trace.source_trace_id)).toEqual(
    sourceTraces.map((trace) => trace.source_trace_id),
  )
  expect(sourceTraces[0].connected_source_port_ids).not.toEqual(
    sourceTraces[1].connected_source_port_ids,
  )

  const { circuit: replay } = getTestFixture()
  replay.add(<CacheBoard cache={{ cacheKey: "same-board", pcbTraces }} />)
  await replay.renderUntilSettled()

  const replayedTraces = replay.db.pcb_trace.list()
  expect(replayedTraces).toHaveLength(2)
  expect(replayedTraces.map((trace) => trace.source_trace_id)).toEqual(
    sourceTraces.map((trace) => trace.source_trace_id),
  )
  for (const [index, trace] of replayedTraces.entries()) {
    // The full route comparison includes widths, layers, orientation and port IDs.
    expect(trace.route).toEqual(pcbTraces[index].route)
    const endpointPortIds = trace.route.flatMap((point) =>
      point.route_type === "wire"
        ? [point.start_pcb_port_id, point.end_pcb_port_id].filter(Boolean)
        : [],
    )
    expect(
      endpointPortIds.map((id) => replay.db.pcb_port.get(id!)?.source_port_id),
    ).toEqual(sourceTraces[index].connected_source_port_ids)
  }
  expect(replay).toMatchPcbSnapshot(import.meta.path)
})
