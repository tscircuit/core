import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { abortableDelay } from "lib/utils/abortable-delay"

test("a remote job response received after cancellation cannot resume polling or record errors", async () => {
  const { circuit } = getTestFixture()
  const requested = Promise.withResolvers<void>()
  const jobResponse = Promise.withResolvers<Response>()
  const requests: string[] = []
  const originalFetch = globalThis.fetch
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      (url: RequestInfo | URL, init?: RequestInit) => {
        if (!String(url).startsWith("http://autorouter.test/")) {
          return originalFetch(url, init)
        }
        const pathname = new URL(String(url)).pathname
        requests.push(pathname)
        if (pathname.endsWith("/create")) {
          return Promise.resolve(
            Response.json({
              autorouting_job: {
                autorouting_job_id: "job_1",
              },
            }),
          )
        }
        requested.resolve()
        // Model a response racing with abort, including fetch shims that do not
        // implement AbortSignal. Core must discard it before inspecting errors.
        return jobResponse.promise
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
        serverMode: "job",
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin1" to="R2.pin1" />
    </board>,
  )
  try {
    const rendering = circuit.renderUntilSettled()
    await requested.promise
    const reason = new Error("Cancel while polling")
    circuit.cancelRendering(reason)
    await expect(rendering).rejects.toBe(reason)
    jobResponse.resolve(
      Response.json({
        autorouting_job: {
          autorouting_job_id: "job_1",
          is_finished: false,
          has_error: true,
          error: { message: "Stale job failure" },
        },
      }),
    )
    await abortableDelay(0)
    expect(requests).toEqual([
      "/autorouting/jobs/create",
      "/autorouting/jobs/get",
    ])
    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  } finally {
    fetchSpy.mockRestore()
  }
})
