import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A net-name typo that starts with a digit (e.g. "3V_VC") used to throw an
// uncaught error deep in the render pipeline, crashing the entire board render
// with no output. It should instead surface as a recoverable circuit-json
// error so the rest of the board still renders.
test("invalid net name (starting with a number) does not crash the render", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin1" to="net.3V_VC" />
    </board>,
  )

  expect(() => circuit.render()).not.toThrow()

  const circuitJson = circuit.getCircuitJson()

  // The offending net name is surfaced as a recoverable error...
  const invalidPropErrors = circuitJson.filter(
    (el) => el.type === "source_invalid_component_property_error",
  ) as Array<{ property_value?: unknown; message: string }>
  expect(invalidPropErrors).toHaveLength(1)
  expect(invalidPropErrors[0].property_value).toBe("net.3V_VC")
  expect(invalidPropErrors[0].message).toContain("cannot start with a number")

  // ...and the rest of the board still renders (the resistor is present).
  expect(circuitJson.some((el) => el.type === "source_component")).toBe(true)
})
