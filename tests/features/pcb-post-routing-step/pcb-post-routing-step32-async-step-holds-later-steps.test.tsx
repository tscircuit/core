import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("steps after an async step wait for it, and design rule checks wait for all of them", async () => {
  const { circuit } = getTestFixture()
  const order: string[] = []
  circuit.on("renderable:renderLifecycle:PcbDesignRuleChecks:start", () => {
    if (!order.includes("drc")) order.push("drc")
  })
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep
        order={1}
        fn={() => {
          order.push("sync 1")
        }}
      />
      <pcbpostroutingstep
        order={2}
        fn={async () => {
          await new Promise((resolve) => setTimeout(resolve, 20))
          order.push("async 2")
        }}
      />
      <pcbpostroutingstep
        order={3}
        fn={async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          order.push("async 3")
        }}
      />
      <pcbpostroutingstep
        order={4}
        fn={() => {
          order.push("sync 4")
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(order).toEqual(["sync 1", "async 2", "async 3", "sync 4", "drc"])
})
