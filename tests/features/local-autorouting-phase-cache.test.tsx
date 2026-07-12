import { expect, test } from "bun:test"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import pkgJson from "../../package.json"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("local autorouting caches and restores results for each phase", async () => {
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

  let solverCallCount = 0
  const algorithmFn = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      solverCallCount++
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

  const renderCircuit = async () => {
    const { circuit } = getTestFixture({ platform: { localCacheEngine } })
    circuit.add(
      <board width="20mm" height="20mm" autorouter={{ algorithmFn }}>
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
    return circuit
  }

  const firstCircuit = await renderCircuit()
  expect(solverCallCount).toBe(2)
  expect(firstCircuit.db.pcb_trace.list()).toHaveLength(2)
  expect(setKeys).toHaveLength(2)
  expect(new Set(setKeys).size).toBe(2)
  for (const key of setKeys) {
    expect(key).toMatch(
      new RegExp(`^core@${pkgJson.version}:srj:[a-f0-9]{32}$`),
    )
  }

  const secondCircuit = await renderCircuit()
  expect(solverCallCount).toBe(2)
  expect(secondCircuit.db.pcb_trace.list()).toEqual(
    firstCircuit.db.pcb_trace.list(),
  )
  expect(getKeys.slice(-2)).toEqual(setKeys)
  expect(setKeys).toHaveLength(2)
})
