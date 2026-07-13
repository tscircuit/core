import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("(ErrorPlaceholder) - schPortArrangement references a pin label not in pinLabels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: ["B2"],
          pin2: ["GND"],
        }}
        schPortArrangement={{
          // "A3" is not defined in pinLabels above
          leftSide: ["B2", "A3"],
          rightSide: ["GND"],
        }}
        footprint="soic2"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const createError = circuitJson.find(
    (e) => e.type === "source_failed_to_create_component_error",
  ) as { message: string } | undefined

  expect(createError).toBeDefined()
  // The message should name the unresolved label and the chip, and make clear
  // the label isn't among the defined pinLabels (rather than claiming none were
  // provided).
  expect(createError!.message).toContain('Pin label "A3"')
  expect(createError!.message).toContain('component "U1"')
  expect(createError!.message).toContain("is not defined in pinLabels")
  expect(createError!.message).toContain('"B2"')
  expect(createError!.message).toContain('"GND"')
  expect(createError!.message).not.toContain("No pin labels provided")
})
