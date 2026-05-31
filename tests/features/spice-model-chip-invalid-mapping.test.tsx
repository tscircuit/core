import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const lm358Model = `
.subckt LM358 OUT IN
R1 OUT IN 1k
.ends LM358
`

test("chip spiceModel invalid mapping creates source_invalid_component_property_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "OUT",
          pin2: "IN",
        }}
        spiceModel={
          <spicemodel source={lm358Model} spicePinMapping={{ VCC: "OUT" }} />
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "source_invalid_component_property_error")

  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    property_name: "spiceModel",
    error_type: "source_invalid_component_property_error",
  })
  expect(errors[0].message).toContain(
    'spicePinMapping references SPICE pin "VCC"',
  )
})
