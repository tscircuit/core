import { expect, test } from "bun:test"
import type { PcbRouteCache } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CacheBoard = ({ cache }: { cache?: PcbRouteCache }) => (
  <board width={10} height={8} pcbRouteCache={cache}>
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
    <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
    <trace from=".R1 > .pin2" to=".R2 > .pin1" pcbPath={[{ x: 3, y: 1 }]} />
    <pcbnotetext text="Manual path takes precedence" pcbY={-2} fontSize={0.4} />
  </board>
)

test("a cache does not duplicate an explicit manual path", async () => {
  const { circuit: original } = getTestFixture()
  original.add(<CacheBoard />)
  await original.renderUntilSettled()
  const pcbTraces = original.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(1)

  const { circuit: replay } = getTestFixture()
  replay.add(<CacheBoard cache={{ cacheKey: "same-board", pcbTraces }} />)
  await replay.renderUntilSettled()
  const replayedTraces = replay.db.pcb_trace.list()
  expect(replayedTraces).toHaveLength(1)
  expect(replayedTraces[0].route).toEqual(pcbTraces[0].route)
  expect(replay).toMatchPcbSnapshot(import.meta.path)
})
