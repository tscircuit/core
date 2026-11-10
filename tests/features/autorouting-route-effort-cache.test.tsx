import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { routeEffort } from "tests/fixtures/createRouteEffortAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a cached routing stage replays stored effort on completion", async () => {
  const cache = new Map<string, string>()
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
    },
  }
  for (let run = 0; run < 2; run++) {
    const { circuit } = getTestFixture({ platform: { localCacheEngine } })
    const ends: AutoroutingEndEvent[] = []
    let progressCount = 0
    circuit.on("autorouting:end", (event) => ends.push(event))
    circuit.on("autorouting:progress", () => progressCount++)
    circuit.add(
      <board width={20} height={10}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
        <trace from="R1.1" to="R2.1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(ends).toHaveLength(1)
    expect(ends[0]!.cacheStatus).toBe(run === 0 ? "miss" : "hit")
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(cache.size).toBe(1)
    if (run === 0) {
      // Custom algorithms bypass this cache, and the published solver does not
      // measure effort yet. Seed its real cache entry with the future payload.
      const [cacheKey, cachedResult] = [...cache.entries()][0]!
      cache.set(
        cacheKey,
        JSON.stringify({ ...JSON.parse(cachedResult), routeEffort }),
      )
    } else {
      expect(progressCount).toBe(0)
      expect(ends[0]!.routeEffort).toEqual(routeEffort)
    }
  }
})
