import { test, expect } from "bun:test"
import { getTestFixture } from "./fixtures/get-test-fixture"

test("should show helpful error message when port selector is invalid", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "OUT",
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0603" />
      {/* Intentionally use wrong port name */}
      <trace from=".U1 > .INVALID_PORT" to=".R1 > .pin1" />
    </board>,
  )

  try {
    circuit.render()
    throw new Error("Should have thrown error")
  } catch (error: any) {
    console.log("Actual error message:", error.message)
    expect(error.message).toBe(
      'Port ".INVALID_PORT" not found on component "U1"',
    )
  }
})
