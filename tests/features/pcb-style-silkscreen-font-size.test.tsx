import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbStyle.silkscreenFontSize should resize silkscreen text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      pcbStyle={{
        silkscreenFontSize: 2,
      }}
    >
      <silkscreentext pcbX={0} pcbY={0} text="HELLO" />
      <silkscreentext pcbX={0} pcbY={3} text="WORLD" fontSize={0.5} />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  // First text should use board's pcbStyle font size
  expect(silkscreenTexts[0].font_size).toBe(2)

  // Second text should use its explicit fontSize prop
  expect(silkscreenTexts[1].font_size).toBe(0.5)
})

test("silkscreenFontSize defaults to 1 when not set", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <silkscreentext pcbX={0} pcbY={0} text="DEFAULT" />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  // Should default to 1
  expect(silkscreenTexts[0].font_size).toBe(1)
})
