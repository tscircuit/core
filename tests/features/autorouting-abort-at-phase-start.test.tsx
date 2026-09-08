import { expect, test } from "bun:test"
import { ControllableAutorouter } from "tests/fixtures/controllable-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("canceling the phase start event prevents creating its autorouter", async () => {
  const { circuit } = getTestFixture()
  const reason = new Error("Cancel before phase initialization")
  let factoryCalled = false
  circuit.on("autorouting:start", () => circuit.cancelRendering(reason))
  circuit.add(
    <board
      width={16}
      height={12}
      autorouter={{
        algorithmFn: async (input) => {
          factoryCalled = true
          return new ControllableAutorouter(input)
        },
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin1" to="R2.pin1" />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toBe(reason)
  expect(factoryCalled).toBe(false)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
})
