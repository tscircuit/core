import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen text with basic knockout", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <silkscreentext
        text="VIN 3-5V"
        pcbX={10}
        pcbY={10}
        fontSize="2mm"
        isKnockout={true}
        knockoutPadding="0.5mm"
      />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts).toHaveLength(1)

  const text = silkscreenTexts[0]
  expect(text.text).toBe("VIN 3-5V")
  expect(text.is_knockout).toBe(true)
  expect(text.knockout_padding).toEqual({
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
  })
})