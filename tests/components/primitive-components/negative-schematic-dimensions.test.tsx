import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("negative schematic dimensions are reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" schWidth={-4} schHeight={3} />
      <schematicbox width={-2} height={2} />
      <schematicrect width={-3} height={1} />
      <schematiccircle center={{ x: 0, y: -8 }} radius={-1} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter(
      (e: any) => e.type === "source_invalid_component_property_error",
    ) as any[]

  const propertyNames = errors.map((e) => e.property_name).sort()
  expect(propertyNames).toContain("schWidth")
  expect(propertyNames).toContain("width")
  expect(propertyNames).toContain("radius")

  const messages = errors.map((e) => e.message).join("\n")
  expect(messages).toContain("must be greater than zero")
})
