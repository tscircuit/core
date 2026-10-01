import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { runCorePromise, runCoreSync } from "lib/effect/core-error"
import { LoadingOverrideBase, loadingOverrideCases } from "./override-loading-fixture"
import "lib/register-catalogue"

test("supplier and React adapters preserve sync precedence, virtual native entry and nonrecursive super", async () => {
  const sourceComponent: Parameters<PartsEngine["findPart"]>[0]["sourceComponent"] = {
    type: "source_component", source_component_id: "source_component_revision", name: "R1", ftype: "simple_resistor", resistance: 1000,
  }
  for (const fixture of loadingOverrideCases) {
    const actor = fixture.create()
    let providerCalls = 0
    const partsEngine: PartsEngine = { findPart: () => { providerCalls++; return { jlcpcb: ["revision"] } } }
    expect(await runCorePromise(actor.querySupplier(partsEngine, sourceComponent))).toEqual({ jlcpcb: ["revision"] })
    expect({ name: fixture.name, calls: actor.calls }).toEqual({ name: fixture.name, calls: fixture.supplier.map((kind) => `supplier:${kind}`) })
    expect(providerCalls).toBe(1)
    actor.calls.length = 0
    const childCount = actor.children.length
    runCoreSync(actor.addEffect(<silkscreentext text="revision extension" />))
    expect({ name: fixture.name, calls: actor.calls }).toEqual({ name: fixture.name, calls: fixture.react.map((kind) => `react:${kind}`) })
    expect(actor.children).toHaveLength(childCount + 1)
    expect(actor.reactSubtrees).toHaveLength(1)
  }
  const original = Object.freeze({ failure: "legacy loading extension" })
  for (const method of ["_getSupplierPartNumbers", "_renderReactSubtree"] as const) {
    const actor = new LoadingOverrideBase()
    let calls = 0
    Object.defineProperty(actor, method, { value: () => { calls++; throw original } })
    let thrown: unknown
    try {
      if (method === "_getSupplierPartNumbers") await runCorePromise(actor.querySupplier({ findPart: () => ({}) }, sourceComponent))
      else runCoreSync(actor.addEffect(<silkscreentext text="throw" />))
    } catch (error) { thrown = error }
    expect(thrown).toBe(original)
    expect(calls).toBe(1)
  }
})
