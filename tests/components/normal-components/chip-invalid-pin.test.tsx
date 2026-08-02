import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with invalid pin should be skipped", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "VIN",
          pin3: "//",
          pin4: "VOUT",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const source_property_ignored_warning = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_property_ignored_warning")
  console.log(source_property_ignored_warning)

  expect(source_property_ignored_warning).toHaveLength(1)
  expect(source_property_ignored_warning[0].message).toContain(
    "Invalid pin label: pin3 = '//' - excluding from component. Pin labels can only contain letters, numbers and underscores.",
  )

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("chip invalid power labels recommend idiomatic identifiers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "3.3V",
          pin2: "+3V3",
          pin3: "+5V",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_property_ignored_warning")

  expect(warnings).toHaveLength(3)
  expect(warnings.map((warning) => warning.message)).toEqual([
    expect.stringContaining('Try using "V3_3" instead.'),
    expect.stringContaining('Try using "V3_3" instead.'),
    expect.stringContaining('Try using "V5" instead.'),
  ])
})

test("schematic arrangements recommend idiomatic identifiers for invalid power labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "3.3V",
          pin2: "GND",
        }}
        schPinArrangement={{
          leftSide: ["3.3V"],
          rightSide: ["GND"],
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_failed_to_create_component_error")

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain('Try using "V3_3" instead.')
})
