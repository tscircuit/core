import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with an unresolvable pinLabels key warns without failing to build", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="bga9"
        pinLabels={{
          pinA1: "VCC",
          pinZ9: "NOT_A_PAD",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // The unresolvable key must not abort component creation.
  const createErrors = circuitJson.filter(
    (el) => el.type === "source_failed_to_create_component_error",
  )
  expect(createErrors).toHaveLength(0)

  const sourceComponent = circuitJson.find(
    (el) => el.type === "source_component" && (el as any).name === "U1",
  )
  expect(sourceComponent).toBeTruthy()

  // The bad key is reported as an ignored property warning instead.
  const warnings = circuitJson.filter(
    (el) =>
      el.type === "source_property_ignored_warning" &&
      (el as any).property_name === "pinLabels",
  )
  expect(warnings.map((w) => (w as any).message)).toContain(
    'Invalid pinLabels key "pinZ9". Expected a pin number (e.g. "pin1") or a footprint pad name (e.g. "pinA1").',
  )
})
