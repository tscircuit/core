import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a re-run replaces the previous run's error instead of adding another", async () => {
  const { circuit } = getTestFixture()
  let runs = 0
  const hook: PcbPostRoutingHook = () => {
    runs++
    throw new Error(`run ${runs}`)
  }
  circuit.add(
    <board width="16mm" height="10mm" pcbPostRoutingHook={hook}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const hookErrors = () =>
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "pcb_autorouting_error")
      .map((e: any) => e.message as string)
  expect(hookErrors()).toEqual(["pcbPostRoutingHook failed: run 1"])
  ;(circuit.children[0] as any)._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()
  expect(hookErrors()).toEqual(["pcbPostRoutingHook failed: run 2"])
})
