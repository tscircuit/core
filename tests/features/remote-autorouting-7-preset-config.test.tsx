import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("remote-autorouter-7 with preset config", async () => {
  if (process.env.CI) return
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" autorouter={{ preset: "auto-cloud" }}>
      <resistor name="R2" pcbX={5} pcbY={0} resistance={100} footprint="0402" />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify routing request was made
  expect(circuit.selectAll("trace").length).toBeGreaterThan(0)
})
