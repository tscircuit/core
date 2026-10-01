import { expect, spyOn, test } from "bun:test"
import {
  createLoadingCircuit,
  flushLoading,
  withLoadingFetch,
} from "./loading-fixture"

test("owned reader cleanup failure is reported by disposal with the original cause", async () => {
  const cleanupFailure = new Error("reader cleanup failed")
  const response = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("["))
      },
      cancel() {
        throw cleanupFailure
      },
    }),
  )
  const transport: typeof fetch = Object.assign(async () => response, {
    preconnect: fetch.preconnect,
  })
  const errors = spyOn(console, "error").mockImplementation(() => {})
  try {
    await withLoadingFetch(transport, async () => {
      const circuit = createLoadingCircuit()
      circuit.add(
        <board>
          <resistor
            name="R1"
            resistance="10k"
            footprint="https://loading.test/part.json"
          />
        </board>,
      )
      circuit.render()
      await flushLoading()
      const failure = await circuit.dispose().then(
        () => undefined,
        (cause: unknown) => cause,
      )
      expect(failure).toBeInstanceOf(AggregateError)
      if (!(failure instanceof AggregateError))
        throw new Error("disposal should report cleanup failure")
      expect(failure.errors).toContain(cleanupFailure)
      expect(response.body?.locked).toBe(false)
      expect(circuit.effectRuntime.activeJobCount).toBe(0)
    })
  } finally {
    errors.mockRestore()
  }
})
