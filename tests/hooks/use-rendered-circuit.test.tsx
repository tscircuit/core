import { test, expect } from "bun:test"
import { RootCircuit } from "lib/Circuit"
import { useRenderedCircuit } from "lib/hooks/use-rendered-circuit"
import React from "react"
import { injectTestHookSystem } from "tests/fixtures/inject-test-hook-system"

test("useRenderedCircuit hook", async () => {
  const { runEffects, renderHook } = injectTestHookSystem(() =>
    useRenderedCircuit(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance="10k" footprint="0402" />
      </board>,
    ),
  )

  const initialRender = renderHook()
  runEffects()

  expect(initialRender.isLoading).toBe(true)

  // Allow the setTimeout in useRenderedCircuit to run
  await new Promise((resolve) => setTimeout(resolve, 10))

  const secondRender = renderHook()

  expect(secondRender.isLoading).toBe(false)
  expect(secondRender.circuitJson).toBeArray()
  expect(secondRender.circuit!.db.pcb_component.list().length).toBe(1)
})
