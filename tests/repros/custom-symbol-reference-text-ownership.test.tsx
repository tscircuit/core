import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: labels outside custom symbol bodies have no component owner", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  const labeledSymbol = (
    <symbol>
      <schematicrect width={1} height={0.5} />
      <schematictext text="{NAME}" schY={0.7} />
    </symbol>
  )
  circuit.add(
    <board>
      <chip name="U1" schX={-2} symbol={labeledSymbol} />
      <chip name="U2" symbol={labeledSymbol} />
      <chip
        name="U3"
        schX={2}
        symbol={
          <symbol>
            <schematicrect width={1} height={0.5} />
          </symbol>
        }
      />
      <schematictext text="U1/U2 have labels; U3 has no label" schY={-1.5} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const referenceTexts = circuit.db.schematic_text
    .list()
    .filter((schematicText) => ["U1", "U2"].includes(schematicText.text))
  expect(referenceTexts.map((schematicText) => schematicText.text)).toEqual([
    "U1",
    "U2",
  ])
  for (const referenceText of referenceTexts) {
    expect(referenceText.schematic_component_id).toBeUndefined()
  }
  const missingReferenceWarnings =
    circuit.db.schematic_component_styling_warning
      .list()
      .filter(
        (warning) =>
          warning.styling_issue_type === "missing_reference_designator_text",
      )
  expect(missingReferenceWarnings).toHaveLength(3)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
