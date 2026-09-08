import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cancelRendering aborts an active remote autorouting request", async () => {
  const { circuit } = getTestFixture()
  const requested = Promise.withResolvers<AbortSignal>()
  const requestAborted = Promise.withResolvers<unknown>()
  const reason = new Error("Cancel remote autorouting")
  const originalFetch = globalThis.fetch
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      (url: RequestInfo | URL, init?: RequestInit) => {
        if (!String(url).startsWith("http://autorouter.test/")) {
          return originalFetch(url, init)
        }
        const signal = init!.signal!
        requested.resolve(signal)
        return new Promise<Response>((resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => {
              requestAborted.resolve(signal.reason)
              reject(signal.reason)
            },
            { once: true },
          )
        })
      },
      { preconnect: originalFetch.preconnect },
    ),
  )
  circuit.add(
    <board
      width={16}
      height={12}
      autorouter={{
        serverUrl: "http://autorouter.test",
        serverMode: "solve-endpoint",
        inputFormat: "simplified",
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin1" to="R2.pin1" />
    </board>,
  )
  try {
    const rendering = circuit.renderUntilSettled()
    const signal = await requested.promise
    circuit.cancelRendering(reason)
    await expect(rendering).rejects.toBe(reason)
    expect(await requestAborted.promise).toBe(reason)
    expect(signal.aborted).toBe(true)
    expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  } finally {
    fetchSpy.mockRestore()
  }
})
