import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import type { AnyCircuitElement } from "circuit-json"
import { IsolatedCircuit } from "lib/IsolatedCircuit"

test("SVG composition observes the public JSON override even when the same subclass defines a native twin", async () => {
  const original = Object.freeze({ failure: "public getCircuitJson" })
  class JsonExtension extends IsolatedCircuit {
    readonly calls: string[] = []
    override getCircuitJson(): AnyCircuitElement[] {
      this.calls.push("sync")
      throw original
    }
    override getCircuitJsonEffect() {
      return Effect.sync((): AnyCircuitElement[] => {
        this.calls.push("native")
        return []
      })
    }
  }
  for (const view of ["pcb", "schematic"] as const) {
    const circuit = new JsonExtension()
    let thrown: unknown
    try { await circuit.getSvg({ view }) } catch (error) { thrown = error }
    expect(thrown).toBe(original)
    expect(circuit.calls).toEqual(["sync"])
    await circuit.dispose()
  }
})
