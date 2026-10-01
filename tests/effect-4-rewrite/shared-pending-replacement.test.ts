import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { corePromise } from "lib/effect/core-error"
import { SharedRenderRegistry } from "lib/effect/shared-render"

test("an older worker cannot remove a newer public pending entry", async () => {
  const registry = new SharedRenderRegistry()
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const original = Promise.withResolvers<AnyCircuitElement[]>()
  const replacement = Promise.withResolvers<AnyCircuitElement[]>()
  const lease = registry.acquire({
    propHash: "updated-subcircuit",
    pendingSubcircuitRenders: pending,
    render: () => corePromise(() => original.promise),
  })
  pending.set("updated-subcircuit", replacement.promise)
  original.resolve([])
  await lease.result
  expect(pending.get("updated-subcircuit")).toBe(replacement.promise)
  await lease.release()
  expect(pending.get("updated-subcircuit")).toBe(replacement.promise)
})
