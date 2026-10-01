import { expect, test } from "bun:test"
import { IsolatedCircuit } from "lib/IsolatedCircuit"
import { runCorePromise, runCoreSync } from "lib/effect/core-error"
import {
  CircuitRenderBase,
  CycleBase,
  circuitRenderOverrideCases,
  cycleOverrideCases,
} from "./override-circuit-fixture"

test("circuit composition preserves legacy sync-method identity precedence and super runs once", async () => {
  for (const fixture of cycleOverrideCases) {
    const circuit = new IsolatedCircuit()
    const actor = fixture.create()
    circuit.add(actor)
    runCoreSync(circuit.renderEffect())
    expect({ name: fixture.name, calls: actor.calls }).toEqual({
      name: fixture.name,
      calls: [...fixture.calls],
    })
    await circuit.dispose()
  }
  for (const operation of ["settle", "json"] as const) {
    for (const fixture of circuitRenderOverrideCases) {
      const circuit = fixture.create()
      if (operation === "settle")
        await runCorePromise(circuit.renderUntilSettledEffect())
      else runCoreSync(circuit.getCircuitJsonEffect())
      expect({ operation, name: fixture.name, calls: circuit.calls }).toEqual({
        operation,
        name: fixture.name,
        calls: [...fixture.calls],
      })
      await circuit.dispose()
    }
  }
  const original = Object.freeze({ failure: "circuit legacy render" })
  for (const operation of ["cycle", "settle", "json"] as const) {
    const circuit = new CircuitRenderBase()
    let calls = 0
    if (operation === "cycle") {
      const actor = new CycleBase({})
      actor.runRenderCycle = () => {
        calls++
        throw original
      }
      circuit.firstChild = actor
    } else
      circuit.render = () => {
        calls++
        throw original
      }
    let thrown: unknown
    try {
      if (operation === "cycle") runCoreSync(circuit.renderEffect())
      else if (operation === "settle") await circuit.renderUntilSettled()
      else circuit.getCircuitJson()
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBe(original)
    expect(calls).toBe(1)
    await circuit.dispose()
  }
})
