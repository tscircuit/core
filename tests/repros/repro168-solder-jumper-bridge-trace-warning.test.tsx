import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// These values (pw=0.6604) are from the SparkFun Qwiic ToF Imager VL53L5CX board
// They are NOT exactly representable in IEEE 754, causing the trace endpoint at
// padWidth/2 to have a compound FP error of ~5.55e-17mm. This previously made
// isPointInPad reject the connected endpoint.
test("solder jumper bridge traces should not generate disconnected endpoint errors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="25mm">
      <solderjumper
        name="JP1"
        footprint="solderjumper2_bridged12_p1.0414_pw0.6604_ph1.27"
        bridgedPins={[["1", "2"]]}
        pinCount={2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // PCB renders correctly — trace connects pad-to-pad visually
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // DRC should tolerate the floating-point representation difference in
  // |0.7112 - 1.0414| versus 0.3302 (halfWidth).
  const traceErrors = circuit.db.pcb_trace_error?.list() ?? []
  console.log(traceErrors[0]?.message)
  expect(traceErrors.length).toBe(0)
})
