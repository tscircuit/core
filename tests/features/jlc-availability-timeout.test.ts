import { expect, test } from "bun:test"
import { checkJlcPartAvailability } from "lib/utils/jlc-part-availability"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("availability timeout settles even if platformFetch ignores abort", async () => {
  const originalSetTimeout = globalThis.setTimeout
  let signal: AbortSignal | null | undefined
  const { circuit } = getTestFixture({
    platform: {
      checkAvailability: true,
      platformFetch: ((_url, options) => {
        signal = options?.signal
        return new Promise<Response>(() => {})
      }) as typeof fetch,
    },
  })
  globalThis.setTimeout = ((
    callback: (...args: any[]) => void,
    delay?: number,
    ...args: any[]
  ) =>
    originalSetTimeout(
      callback,
      delay === 10_000 ? 0 : delay,
      ...args,
    )) as typeof setTimeout
  try {
    expect(await checkJlcPartAvailability(circuit, "C1525")).toBe(false)
    expect(signal?.aborted).toBe(true)
  } finally {
    globalThis.setTimeout = originalSetTimeout
  }
})
