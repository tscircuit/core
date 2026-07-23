import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSection assigns nested children to the section", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <schematicsection name="input" displayName="Input Section">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="1uF" footprint="0402" />
      </schematicsection>
      <schematicsection name="output" displayName="Output Section">
        <resistor name="R2" resistance="10k" footprint="0402" />
        <led name="D1" footprint="0603" />
      </schematicsection>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.selectOne(".R1")?.getSchematicSectionName()).toBe("input")
  expect(circuit.selectOne(".C1")?.getSchematicSectionName()).toBe("input")
  expect(circuit.selectOne(".R2")?.getSchematicSectionName()).toBe("output")
  expect(circuit.selectOne(".D1")?.getSchematicSectionName()).toBe("output")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
