import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an async step finishes before PCB design rule checks start", async () => {
  const { circuit } = getTestFixture()
  const order: string[] = []
  circuit.on("renderable:renderLifecycle:PcbDesignRuleChecks:start", () => {
    if (!order.includes("drc")) order.push("drc")
  })
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep
        fn={async () => {
          await new Promise((resolve) => setTimeout(resolve, 20))
          order.push("step")
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(order).toEqual(["step", "drc"])
})
