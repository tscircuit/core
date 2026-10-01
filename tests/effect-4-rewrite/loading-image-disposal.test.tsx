import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  createLoadingFetch,
  flushLoading,
  withLoadingFetch,
} from "./loading-fixture"

test("both graphic jobs abort their transport and close noncooperative late response bodies", async () => {
  const { platformFetch, requests } = createLoadingFetch({ ignoreAbort: true })
  await withLoadingFetch(platformFetch, async () => {
    const circuit = createLoadingCircuit()
    circuit.add(
      <board width={10} height={10}>
        <silkscreengraphic
          imageUrl="https://images.test/pcb.svg"
          width={2}
          height={2}
        />
        <schematicgraphic
          imageUrl="https://images.test/sch.svg"
          width={2}
          height={2}
        />
      </board>,
    )
    circuit.render()
    await flushLoading()
    expect(requests).toHaveLength(2)
    await circuit.dispose()
    expect(requests.every((request) => request.signal.aborted)).toBe(true)
    let closedBodies = 0
    for (const request of requests)
      request.resolve(
        new Response(
          new ReadableStream({
            cancel() {
              closedBodies++
            },
          }),
          { headers: { "content-type": "image/svg+xml" } },
        ),
      )
    await flushLoading()
    expect(closedBodies).toBe(2)
    expect(requests.every((request) => !request.listening)).toBe(true)
    expect(circuit.db.pcb_silkscreen_graphic.list()).toHaveLength(0)
    expect(circuit.db.schematic_graphic.list()).toHaveLength(0)
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
  })
})
