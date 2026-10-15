import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a step that throws leaves a pcb_autorouting_error naming the step", async () => {
  const { circuit } = getTestFixture()
  const hook: PcbPostRoutingFn = () => {
    throw new Error("boom")
  }
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep fn={hook} />
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
  expect(hookErrors()).toEqual(["<pcbpostroutingstep /> failed: boom"])
})
