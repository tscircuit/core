import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: default Zener symbol ignores opposite schematic rotations", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <schematictext
        text="Default Zener symbol: opposite rotations"
        schY={2}
        fontSize={0.3}
      />
      <schematictext text="schRotation=90" schX={-2} schY={1} fontSize={0.25} />
      <schematictext text="schRotation=-90" schX={2} schY={1} fontSize={0.25} />
      <diode name="D1" variant="zener" schX={-2} schRotation={90} />
      <diode name="D2" variant="zener" schX={2} schRotation={-90} />
      <schematictext
        text="Expected: opposite directions. Actual: both point up."
        schY={-1.5}
        fontSize={0.25}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Preserve the bug: both rotations select zener_diode_vert.
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
