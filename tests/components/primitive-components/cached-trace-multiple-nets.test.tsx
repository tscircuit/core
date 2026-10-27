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
      text="BUG: cached nets are joined"
      pcbX={0}
      pcbY={0}
      fontSize={0.4}
    />
  </board>
)

test("replaying a cache joins routes from distinct source traces", async () => {
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
  // Each logical trace incorrectly receives both routes, including both nets' ports.
  for (const trace of replayedTraces) {
    expect(trace.route).toEqual(pcbTraces.flatMap((cached) => cached.route))
  }
  expect(replay).toMatchPcbSnapshot(import.meta.path)
})
