import { expect, test } from "bun:test"
import type { PcbRouteCache } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CacheBoard = ({ cache }: { cache?: PcbRouteCache }) => (
  <board width={12} height={10} pcbRouteCache={cache}>
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} pcbY={2} />
    <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} pcbY={2} />
    <resistor name="R3" resistance="1k" footprint="0402" pcbX={-3} pcbY={-2} />
    <resistor name="R4" resistance="1k" footprint="0402" pcbX={3} pcbY={-2} />
    <trace
      from=".R1 > .pin2"
      to=".R2 > .pin1"
      pcbPath={cache ? undefined : [{ x: 3, y: 1 }]}
    />
    <trace
      from=".R3 > .pin2"
      to=".R4 > .pin1"
      pcbPath={cache ? undefined : [{ x: 3, y: -1 }]}
    />
    <pcbnotetext text="Partial cache: one routed net" pcbY={0} fontSize={0.4} />
  </board>
)

test("a partial cache is not assigned to another source trace", async () => {
  const { circuit: original } = getTestFixture()
  original.add(<CacheBoard />)
  await original.renderUntilSettled()
  const pcbTraces = original.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(2)

  const { circuit: replay } = getTestFixture()
  replay.add(
    <CacheBoard
      cache={{ cacheKey: "same-board", pcbTraces: pcbTraces.slice(0, 1) }}
    />,
  )
  await replay.renderUntilSettled()
  const replayedTraces = replay.db.pcb_trace.list()
  expect(
    replayedTraces
      .filter((trace) => trace.source_trace_id === pcbTraces[0].source_trace_id)
      .map((trace) => trace.route),
  ).toEqual([pcbTraces[0].route])
  const uncachedTrace = replayedTraces.find(
    (trace) => trace.source_trace_id === pcbTraces[1].source_trace_id,
  )
  expect(uncachedTrace).toBeDefined()
  expect(uncachedTrace!.route).not.toEqual(pcbTraces[0].route)
  expect(uncachedTrace!.route[0]).toMatchObject({
    route_type: "wire",
    start_pcb_port_id: "pcb_port_5",
  })
  expect(replayedTraces.every((trace) => Boolean(trace.pcb_trace_id))).toBe(
    true,
  )
  expect(new Set(replayedTraces.map((trace) => trace.pcb_trace_id)).size).toBe(
    2,
  )
  expect(replay).toMatchPcbSnapshot(import.meta.path)
})
