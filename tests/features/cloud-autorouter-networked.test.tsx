import { expect, test } from "bun:test"
import {
  AUTOROUTER_VERSION,
  solvePipeline9NetworkedHighDensityNode,
} from "@tscircuit/capacity-autorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("platform cloud autorouting renders a board through versioned networked node requests", async () => {
  const originalFetch = globalThis.fetch
  let solveCount = 0
  globalThis.fetch = (async (url, init) => {
    if (!String(url).startsWith("https://hd-cache2.tscircuit.com/")) {
      return originalFetch(url, init)
    }
    const body = JSON.parse(String(init?.body))
    expect(body.autorouterVersion).toBe(AUTOROUTER_VERSION)
    if (String(url).endsWith("/solve-batch")) {
      return new Response(
        body.items
          .map((item: { requestId: string }) =>
            JSON.stringify({
              requestId: item.requestId,
              ok: false,
              code: "CACHE_MISS",
              autorouterVersion: AUTOROUTER_VERSION,
              message: "No cached result exists for this exact input.",
            }),
          )
          .join("\n") + "\n",
        { headers: { "content-type": "application/x-ndjson" } },
      )
    }
    solveCount++
    return Response.json({
      ok: true,
      source: "solver",
      autorouterVersion: AUTOROUTER_VERSION,
      ...(await solvePipeline9NetworkedHighDensityNode(body.input)),
    })
  }) as typeof fetch
  try {
    const platform = { useCloudAutorouter: true, localCacheEngine: undefined }
    const { circuit } = getTestFixture({ platform })
    const solvers: string[] = []
    circuit.on("solver:started", (event) => solvers.push(event.solverName))
    circuit.add(
      <board width={20} height={20}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
        <pcbnotetext
          text="Cloud Pipeline9 with exact autorouter version"
          pcbY={-8}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(solvers).toContain("AutoroutingPipelineSolver9_Networked")
    expect(solveCount).toBeGreaterThan(0)
    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  } finally {
    globalThis.fetch = originalFetch
  }
})
