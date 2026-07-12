import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("MOSFET symbol port sides control symbol orientation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" schAutoLayoutEnabled grid gridGap="1mm">
      <mosfet name="normal" channelType="n" mosfetMode="enhancement" />
      <mosfet
        name="right"
        channelType="n"
        mosfetMode="enhancement"
        symbolGateSide="right"
      />
      <mosfet
        name="source_top"
        channelType="n"
        mosfetMode="enhancement"
        symbolSourceSide="top"
      />
      <mosfet
        name="both"
        channelType="n"
        mosfetMode="enhancement"
        symbolGateSide="right"
        symbolDrainSide="bottom"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    grid: { cellSize: 0.5, labelCells: true },
  })
})
