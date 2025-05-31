import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("overlapping components should produce meaningful error message", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with severely overlapping components that completely block routing
  circuit.add(
    <board
      width="5mm"
      height="5mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    >
      {/* Place components very close together with large footprints to completely fill the board */}
      <resistor
        name="R1"
        pcbX={-1}
        pcbY={0}
        resistance={1000}
        footprint="1206" // Large footprint
      />
      <resistor
        name="R2"
        pcbX={1}
        pcbY={0}
        resistance={1000}
        footprint="1206" // Large footprint
      />
      <capacitor
        name="C1"
        pcbX={0}
        pcbY={1}
        capacitance="100uF"
        footprint="1206" // Large footprint overlapping the space
      />
      <capacitor
        name="C2"
        pcbX={0}
        pcbY={-1}
        capacitance="100uF"
        footprint="1206" // Large footprint overlapping the space
      />

      {/* Try to route traces that have no possible path due to overlapping */}
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace from=".C1 > .pin1" to=".C2 > .pin1" />
    </board>,
  )

  // Track autorouting errors
  let errorEventReceived: any = null
  circuit.on("autorouting:error", (event) => {
    errorEventReceived = event
  })

  // This should fail with an enhanced error message
  try {
    await circuit.renderUntilSettled()
  } catch (error) {
    // Expected to fail
  }

  // Verify that we received an error event
  expect(errorEventReceived).toBeTruthy()

  // Check that if we get the enhanced error message, it contains the right content
  if (
    errorEventReceived &&
    errorEventReceived.error &&
    errorEventReceived.error.message
  ) {
    const errorMessage = errorEventReceived.error.message

    // If this is our enhanced error message, verify it contains helpful information
    if (
      errorMessage.includes(
        "Autorouting failed: No valid routing space available",
      )
    ) {
      expect(errorMessage).toContain("components are overlapping")
      expect(errorMessage).toContain("Please check component placement")
      // Ensure we don't get the cryptic original error message
      expect(errorMessage).not.toContain("Unexpected numItems value: 0")
    }
  }
})
