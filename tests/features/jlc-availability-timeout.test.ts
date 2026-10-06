import { expect, test } from "bun:test"
import { checkPartAvailability } from "lib/utils/part-availability"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PartsEngine } from "@tscircuit/props"

test("availability timeout settles even if the engine ignores abort", async () => {
  const originalSetTimeout = globalThis.setTimeout
  let signal: AbortSignal | undefined
  const partsEngine: PartsEngine = {
    findPart: () => ({}),
    fetchPartAvailability: (request) => {
      signal = request.signal
      return new Promise(() => {})
    },
  }
  const { circuit } = getTestFixture({
    platform: { checkAvailability: true, partsEngine },
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
    expect(
      await checkPartAvailability(circuit, {
        partsEngine,
        supplierName: "jlcpcb",
        supplierPartNumber: "C1525",
      }),
    ).toBe(false)
    expect(signal?.aborted).toBe(true)
  } finally {
    globalThis.setTimeout = originalSetTimeout
  }
})
