import { expect, test } from "bun:test"
import type { PcbSilkscreenText } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const describeText = (text: PcbSilkscreenText) => ({
  text: text.text,
  font: text.font,
  fontSize: text.font_size,
  alignment: text.anchor_alignment,
  rotation: text.ccw_rotation,
  layer: text.layer,
})

test("saved silkscreen survives Circuit JSON import", async () => {
  const { circuit: original } = getTestFixture()
  original.add(
    <board width={24} height={14} routingDisabled>
      {(["top", "bottom"] as const).map((layer, row) =>
        [0, 90, 180, 270].map((rotation, column) => (
          <resistor
            key={`${layer}-${rotation}`}
            name={`R_${layer}_${rotation}`}
            resistance="1k"
            footprint="0402"
            pcbX={-9 + column * 6}
            pcbY={3 - row * 6}
            pcbRotation={rotation}
            layer={layer}
          />
        )),
      )}
    </board>,
  )
  await original.renderUntilSettled()

  const { circuit: imported } = getTestFixture()
  imported.add(
    <board
      width={24}
      height={14}
      routingDisabled
      circuitJson={original.getCircuitJson()}
    />,
  )
  await imported.renderUntilSettled()

  const originalText = original.db.pcb_silkscreen_text.list()
  expect(originalText).toHaveLength(8)
  expect(originalText.filter((text) => text.layer === "bottom")).toHaveLength(4)
  expect(imported.db.pcb_silkscreen_text.list().map(describeText)).toEqual(
    originalText.map(describeText),
  )
  for (const text of originalText) {
    const importedText = imported.db.pcb_silkscreen_text.getWhere({
      text: text.text,
    })!
    expect(importedText.anchor_position.x).toBeCloseTo(
      text.anchor_position.x,
      10,
    )
    expect(importedText.anchor_position.y).toBeCloseTo(
      text.anchor_position.y,
      10,
    )
  }
})
