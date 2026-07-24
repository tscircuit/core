import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol ignores connections without chipRef", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <schematicsymbol
        name="A"
        symbolName="diode_right"
        connections={{
          pin1: "D1.A",
          pin2: "D1.K",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_property_ignored_warning.list()).toEqual([
    expect.objectContaining({
      property_name: "connections",
      message: expect.stringContaining(
        "has connections without chipRef. connections will be ignored.",
      ),
    }),
  ])

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
