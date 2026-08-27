import { expect, test } from "bun:test"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { getTestFixture } from "../fixtures/get-test-fixture"

type ExplicitAutorouterVersion = "beta_pipeline7" | "beta_pipeline9"

test("local autorouting cache separates explicit Pipeline7 and Pipeline9", async () => {
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

  const renderCircuit = async (
    autorouterVersion: ExplicitAutorouterVersion,
  ): Promise<string[]> => {
    const { circuit } = getTestFixture({ platform: { localCacheEngine } })
    const startedAutorouters: string[] = []
    circuit.on("solver:started", ({ solverName }) => {
      if (
        solverName.startsWith("AutoroutingPipeline") ||
        solverName.startsWith("AssignableAutoroutingPipeline")
      ) {
        startedAutorouters.push(solverName)
      }
    })
    circuit.add(
      <board width="20mm" height="10mm" autorouterVersion={autorouterVersion}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={0}
        />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    return startedAutorouters
  }

  expect(await renderCircuit("beta_pipeline7")).toEqual([
    "AutoroutingPipelineSolver7_MultiGraph",
  ])
  expect(await renderCircuit("beta_pipeline9")).toEqual([
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  ])

  const phaseCacheKeys = setKeys.filter((key) => key.startsWith("routes:"))
  expect(phaseCacheKeys).toHaveLength(2)
  expect(new Set(phaseCacheKeys).size).toBe(2)
  expect(phaseCacheKeys[0]).toContain(
    ":solver:AutoroutingPipelineSolver7_MultiGraph:",
  )
  expect(phaseCacheKeys[1]).toContain(
    ":solver:AutoroutingPipelineSolver9_PreloadedTraceGraph:",
  )
  expect(
    new Set(phaseCacheKeys.map((key) => key.match(/:srj:([a-f0-9]{16})$/)?.[1]))
      .size,
  ).toBe(1)

  const getCountBeforePipeline9CacheHit = getKeys.length
  expect(await renderCircuit("beta_pipeline9")).toEqual([])
  expect(
    getKeys
      .slice(getCountBeforePipeline9CacheHit)
      .filter((key) => key.startsWith("routes:")),
  ).toEqual([phaseCacheKeys[1]])
  expect(setKeys.filter((key) => key.startsWith("routes:"))).toEqual(
    phaseCacheKeys,
  )
})
