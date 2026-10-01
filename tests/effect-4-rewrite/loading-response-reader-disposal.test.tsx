import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  flushLoading,
  withLoadingFetch,
} from "./loading-fixture"

test("disposing HTTP and image jobs cancels their owned readers even if response bodies ignore transport abort", async () => {
  for (const kind of ["footprint", "image"] as const) {
    let bodyCancellations = 0
    let acquiredSignal: AbortSignal | null | undefined
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(kind === "footprint" ? "[" : "<svg"),
          )
        },
        cancel() {
          bodyCancellations++
        },
      }),
      {
        headers: {
          "content-type":
            kind === "image" ? "image/svg+xml" : "application/json",
        },
      },
    )
    const transport: typeof fetch = Object.assign(
      async (_input: Parameters<typeof fetch>[0], options?: RequestInit) => {
        acquiredSignal = options?.signal
        return response
      },
      { preconnect: fetch.preconnect },
    )
    await withLoadingFetch(transport, async () => {
      const circuit = createLoadingCircuit()
      circuit.add(
        <board width={10} height={10}>
          {kind === "footprint" ? (
            <resistor
              name="R1"
              resistance="10k"
              footprint="https://loading.test/part.json"
            />
          ) : (
            <silkscreengraphic
              imageUrl="https://loading.test/image.svg"
              width={2}
              height={2}
            />
          )}
        </board>,
      )
      circuit.render()
      await flushLoading()
      expect(response.body?.locked).toBe(true)
      await circuit.dispose()
      expect(acquiredSignal?.aborted).toBe(true)
      expect(bodyCancellations).toBe(1)
      expect(response.body?.locked).toBe(false)
      expect(circuit.effectRuntime.activeJobCount).toBe(0)
      expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
    })
  }
})
