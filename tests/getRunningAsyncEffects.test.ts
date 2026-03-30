import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("getRunningAsyncEffects returns currently running async effects", () => {
  const circuit = new RootCircuit()

  circuit.emit("asyncEffect:start", {
    asyncEffectId: "render:1",
    effectName: "first-effect",
    componentDisplayName: "<board#1 />",
    phase: "PcbTraceRender",
  })

  circuit.emit("asyncEffect:start", {
    asyncEffectId: "render:2",
    effectName: "second-effect",
    componentDisplayName: "<resistor#1 />",
    phase: "PcbTraceRender",
  })

  expect(circuit.getRunningAsyncEffects()).toEqual([
    {
      asyncEffectId: "render:1",
      effectName: "first-effect",
      componentDisplayName: "<board#1 />",
      phase: "PcbTraceRender",
      error: undefined,
    },
    {
      asyncEffectId: "render:2",
      effectName: "second-effect",
      componentDisplayName: "<resistor#1 />",
      phase: "PcbTraceRender",
      error: undefined,
    },
  ])

  circuit.emit("asyncEffect:end", { asyncEffectId: "render:1" })

  expect(circuit.getRunningAsyncEffects()).toEqual([
    {
      asyncEffectId: "render:2",
      effectName: "second-effect",
      componentDisplayName: "<resistor#1 />",
      phase: "PcbTraceRender",
      error: undefined,
    },
  ])

  circuit.emit("asyncEffect:end", { asyncEffectId: "render:2" })

  expect(circuit.getRunningAsyncEffects()).toEqual([])
})
