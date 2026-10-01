import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { corePromise } from "lib/effect/core-error"
import { SharedRenderRegistry } from "lib/effect/shared-render"

test("shared failure preserves the original error and permits a subsequent retry", async () => {
  const registry = new SharedRenderRegistry()
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const cause = { message: "platform failure" }
  const failed = registry.acquire({
    propHash: "retry-subcircuit",
    pendingSubcircuitRenders: pending,
    render: () => corePromise(() => Promise.reject(cause)),
  })
  expect(await failed.result.catch((error) => error)).toBe(cause)
  expect(pending.size).toBe(0)
  await failed.release()
  const retry = registry.acquire({
    propHash: "retry-subcircuit",
    pendingSubcircuitRenders: pending,
    render: () => corePromise(() => Promise.resolve([])),
  })
  expect(await retry.result).toEqual([])
  expect(pending.size).toBe(0)
  await retry.release()
})
