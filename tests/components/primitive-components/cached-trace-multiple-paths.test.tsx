import { expect, test } from "bun:test"
import type { PcbRouteCache } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CacheBoard = ({ cache }: { cache?: PcbRouteCache }) => (
  <board width={18} height={12} pcbRouteCache={cache}>
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} pcbY={3} />
    <resistor name="R3" resistance="1k" footprint="0603" pcbX={5} pcbY={-3} />
    <trace
      path={[".R1 > .pin2", ".R2 > .pin1", ".R3 > .pin1"]}
      pcbPathRelativeTo=".R1 > .pin2"
      pcbPaths={
        cache
          ? undefined
          : [
              [".R1 > .pin2", { x: 5, y: 0 }],
              [{ x: 5, y: 0 }, ".R2 > .pin1"],
              [{ x: 5, y: 0 }, ".R3 > .pin1"],
            ]
      }
      thickness={0.35}
    />
    <pcbnotetext text="One net, three cached paths" pcbY={5} fontSize={0.45} />
  </board>
)

test("cached paths of one source trace remain separate", async () => {
  const { circuit: original } = getTestFixture()
  original.add(<CacheBoard />)
  await original.renderUntilSettled()
  const pcbTraces = original.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(3)
  expect(new Set(pcbTraces.map((trace) => trace.source_trace_id)).size).toBe(1)

  const { circuit: replay } = getTestFixture()
  replay.add(<CacheBoard cache={{ cacheKey: "same-board", pcbTraces }} />)
  await replay.renderUntilSettled()
  const replayedTraces = replay.db.pcb_trace.list()
  expect(replayedTraces).toHaveLength(3)
  expect(replayedTraces.map((trace) => trace.route)).toEqual(
    pcbTraces.map((trace) => trace.route),
  )
  expect(replayedTraces.map((trace) => trace.source_trace_id)).toEqual(
    pcbTraces.map((trace) => trace.source_trace_id),
  )
  expect(replay).toMatchPcbSnapshot(import.meta.path)
})
