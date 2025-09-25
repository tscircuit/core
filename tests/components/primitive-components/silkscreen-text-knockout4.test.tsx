import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen text with knockout enabled applies default padding", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <silkscreentext
        text="DEFAULT PADDING"
        pcbX={10}
        pcbY={10}
        fontSize="2mm"
        isKnockout={true}
      />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts).toHaveLength(1)

  const text = silkscreenTexts[0]
  expect(text.text).toBe("DEFAULT PADDING")
  expect(text.is_knockout).toBe(true)
  // Default padding of 0.2mm should be applied
  expect(text.knockout_padding).toEqual({
    left: 0.2,
    right: 0.2,
    top: 0.2,
    bottom: 0.2,
  })
})