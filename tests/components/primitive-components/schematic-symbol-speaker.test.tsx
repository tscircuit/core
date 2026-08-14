import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("speaker library symbol renders with connected polarity ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematicsymbol
        name="SPK1"
        symbolName="speaker_right"
        schX={0}
        schY={0}
      />
      <trace from=".SPK1 > .pos" to="net.VCC" />
      <trace from=".SPK1 > .neg" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: { cellSize: 0.2, labelCells: false },
  })
})
