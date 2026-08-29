import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic section titles overlap when anchored bounds intersect", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsection name="horizontal" displayName="1. Horizontal section" />
      <schematicsection name="vertical" displayName="2. Vertical section" />

      <resistor
        name="R1"
        resistance="1k"
        schX={-2}
        schY={0}
        schSectionName="horizontal"
      />
      <resistor
        name="R2"
        resistance="1k"
        schX={2}
        schY={0}
        schSectionName="horizontal"
      />
      <resistor
        name="R3"
        resistance="1k"
        schX={0}
        schY={-2}
        schSectionName="vertical"
      />
      <resistor
        name="R4"
        resistance="1k"
        schX={0}
        schY={2}
        schSectionName="vertical"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
