import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schFlexDirection column order", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="16mm" routingDisabled>
      <group schFlex schFlexDirection="column" schGap={1}>
        <resistor name="FIRST" resistance="1k" footprint="0603" />
        <resistor name="SECOND" resistance="1k" footprint="0603" />
        <resistor name="THIRD" resistance="1k" footprint="0603" />
      </group>
      <schematictext
        schX={0}
        schY={3}
        fontSize={0.3}
        text="column: FIRST should be on top"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
