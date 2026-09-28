import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached phases emit independent replayable arrays without earlier phase copper", async () => {
  const cache = new Map<string, string>()
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
    },
  }
  const runs: AutoroutingEndEvent[][] = []
  for (let run = 0; run < 2; run++) {
    const { circuit } = getTestFixture({ platform: { localCacheEngine } })
    const events: AutoroutingEndEvent[] = []
    circuit.on("autorouting:end", (event) =>
      events.push(structuredClone(event)),
    )
    circuit.add(
      <board width={20} height={12}>
        {[0, 1].map((phaseIndex) => (
          <group key={phaseIndex}>
            <resistor
              name={`L${phaseIndex}`}
              resistance="1k"
              footprint="0402"
              pcbX={-5}
              pcbY={phaseIndex * 4 - 2}
            />
            <resistor
              name={`R${phaseIndex}`}
              resistance="1k"
              footprint="0402"
              pcbX={5}
              pcbY={phaseIndex * 4 - 2}
            />
            <trace
              from={`L${phaseIndex}.1`}
              to={`R${phaseIndex}.1`}
              routingPhaseIndex={phaseIndex}
            />
          </group>
        ))}
        <pcbnotetext
          text="Two separately exported routing phases"
          pcbY={4}
          fontSize={0.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(events).toHaveLength(2)
    for (const event of events) {
      expect(event.cacheStatus).toBe(run === 0 ? "miss" : "hit")
      expect(event.pcbTracePathsUnavailableReason).toBeUndefined()
      expect(event.pcbTracePaths).toHaveLength(1)
    }
    runs.push(events)
    if (run === 1) await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
  expect(runs[0]!.map((event) => event.pcbTracePaths)).toEqual(
    runs[1]!.map((event) => event.pcbTracePaths),
  )
})
