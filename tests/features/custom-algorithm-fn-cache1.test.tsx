import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("custom algorithmFn results are cached under the cache engine's code fingerprint", async () => {
  const cache = new Map<string, string>()
  let fingerprint: string | null = "v1"
  const fingerprintedFns: Function[] = []
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
    },
    getAlgorithmFnFingerprint: (algorithmFn) => {
      fingerprintedFns.push(algorithmFn)
      return fingerprint
    },
  }

  let callCount = 0
  const algorithmFn = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      callCount++
      return simpleRouteJson.connections.map((connection) => {
        const [start, end] = connection.pointsToConnect
        const width =
          connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth
        return {
          type: "pcb_trace" as const,
          pcb_trace_id: `custom_${connection.name}`,
          connection_name: connection.name,
          route: [
            { route_type: "wire" as const, ...start, width },
            { route_type: "wire" as const, ...end, width },
          ],
        }
      })
    },
  )

  const render = async () => {
    const { circuit } = getTestFixture({ platform: { localCacheEngine } })
    const starts: AutoroutingStartEvent[] = []
    circuit.on("autorouting:start", (event) => starts.push(event))
    circuit.add(
      <board width="20mm" height="20mm" autorouter={{ algorithmFn }}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    return { circuit, start: starts[0] }
  }

  const first = await render()
  expect(fingerprintedFns[0]).toBe(algorithmFn)
  expect(callCount).toBe(1)
  expect(first.start).toMatchObject({
    autorouterName: "custom",
    cacheStatus: "miss",
  })
  expect(first.start.cacheKey).toContain(":algorithm:v1:srj:")

  const second = await render()
  expect(callCount).toBe(1)
  expect(second.start).toMatchObject({
    cacheStatus: "hit",
    cacheKey: first.start.cacheKey,
  })
  expect(second.circuit.db.pcb_trace.list()).toEqual(
    first.circuit.db.pcb_trace.list(),
  )

  // Changed algorithm code gets a new fingerprint and is routed again.
  fingerprint = "v2"
  const changed = await render()
  expect(callCount).toBe(2)
  expect(changed.start.cacheStatus).toBe("miss")
  expect(changed.start.cacheKey).toContain(":algorithm:v2:srj:")

  // An algorithm the engine cannot identify is never cached.
  fingerprint = null
  const unidentified = await render()
  expect(callCount).toBe(3)
  expect(unidentified.start).toMatchObject({
    cacheStatus: "disabled",
    cacheDisabledReason: "custom_algorithm_not_fingerprintable",
  })
})
