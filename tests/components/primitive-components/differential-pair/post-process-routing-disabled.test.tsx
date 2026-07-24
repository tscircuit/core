import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("differential pair post-processing is skipped when routing is disabled", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  let solverInvocationCount = 0

  circuit.on("solver:started", (event) => {
    if (event.solverName === "DifferentialPairSolver") {
      solverInvocationCount += 1
    }
  })

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <trace name="USB_P" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="USB_N" from=".U1 > .pin2" to=".U2 > .pin6" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverInvocationCount).toBe(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
})
