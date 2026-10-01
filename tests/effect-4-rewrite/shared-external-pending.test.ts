import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import { SharedRenderRegistry } from "lib/effect/shared-render"

test("externally owned pending renders retain their Promise and cleanup ownership", async () => {
  const external = Promise.withResolvers<AnyCircuitElement[]>()
  const pending = new Map([["external-subcircuit", external.promise]])
  const registry = new SharedRenderRegistry()
  let rendered = false
  const lease = registry.acquire({
    propHash: "external-subcircuit",
    pendingSubcircuitRenders: pending,
    render: () => {
      rendered = true
      return Effect.succeed([])
    },
  })
  expect(lease.result).toBe(external.promise)
  await lease.release()
  expect(pending.get("external-subcircuit")).toBe(external.promise)
  expect(rendered).toBe(false)
  external.resolve([])
  expect(await lease.result).toEqual([])
})
