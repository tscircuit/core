import { expect, test } from "bun:test"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import pkgJson from "../../package.json"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("built-in local autorouting caches each phase and custom algorithms bypass the cache", async () => {
  const cache = new Map<string, string>()
  const getKeys: string[] = []
  const setKeys: string[] = []
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => {
      getKeys.push(key)
      return cache.get(key) ?? null
    },
    setItem: (key, value) => {
      setKeys.push(key)
      cache.set(key, value)
    },
  }

  let customSolverCallCount = 0
  const customAlgorithmFn = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      customSolverCallCount++
      return simpleRouteJson.connections.map((connection) => {
        const [start, end] = connection.pointsToConnect
        return {
          type: "pcb_trace" as const,
          pcb_trace_id: `cached_${connection.name}`,
          connection_name: connection.name,
          route: [
            {
              route_type: "wire" as const,
              x: start.x,
              y: start.y,
              width:
                connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth,
              layer: start.layer,
            },
            {
              route_type: "wire" as const,
              x: end.x,
              y: end.y,
              width:
                connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth,
              layer: end.layer,
            },
          ],
        }
      })
    },
  )

  const renderCircuit = async (algorithmFn?: typeof customAlgorithmFn) => {
    const { circuit } = getTestFixture({ platform: { localCacheEngine } })
    let autoroutingProgressCount = 0
    circuit.on("autorouting:progress", () => {
      autoroutingProgressCount++
    })
    circuit.add(
      <board
        width="20mm"
        height="20mm"
        autorouter={algorithmFn ? { algorithmFn } : undefined}
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-7}
          pcbY={-3}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={-3}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-7}
          pcbY={3}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={3}
        />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
        <trace from=".R3 > .pin1" to=".R4 > .pin1" routingPhaseIndex={1} />
      </board>,
    )
    await circuit.renderUntilSettled()
    return { circuit, autoroutingProgressCount }
  }

  const firstRender = await renderCircuit()
  expect(firstRender.autoroutingProgressCount).toBeGreaterThan(0)
  const firstCircuit = firstRender.circuit
  expect(firstCircuit.db.pcb_trace.list()).toHaveLength(2)
  expect(setKeys).toHaveLength(2)
  expect(new Set(setKeys).size).toBe(2)
  for (const key of setKeys) {
    expect(key).toMatch(
      new RegExp(`^routes:core@${pkgJson.version}:srj:[a-f0-9]{32}$`),
    )
  }

  const secondRender = await renderCircuit()
  expect(secondRender.autoroutingProgressCount).toBe(0)
  const secondCircuit = secondRender.circuit
  expect(secondCircuit.db.pcb_trace.list()).toEqual(
    firstCircuit.db.pcb_trace.list(),
  )
  expect(getKeys.slice(-2)).toEqual(setKeys)
  expect(setKeys).toHaveLength(2)

  const getCountBeforeCustomAutorouting = getKeys.length
  const setCountBeforeCustomAutorouting = setKeys.length
  const customRender = await renderCircuit(customAlgorithmFn)
  expect(customSolverCallCount).toBe(2)
  expect(customRender.circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(getKeys).toHaveLength(getCountBeforeCustomAutorouting)
  expect(setKeys).toHaveLength(setCountBeforeCustomAutorouting)
})
