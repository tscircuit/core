import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"

test("remote-autorouter-6 cloud autorouting on group", async () => {
  if (process.env.CI) return
  const { circuit } = getTestFixture()

  // Create a basic circuit that needs routing
  circuit.add(
    <group autorouter={"auto-cloud" as any}>
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </group>,
  )

  await circuit.renderUntilSettled()

  // Verify routing request was made
  expect(circuit.selectAll("trace").length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
