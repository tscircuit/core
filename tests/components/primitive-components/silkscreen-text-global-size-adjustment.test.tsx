import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Global Silkscreen Text Size Adjustment with pcbStyle", async () => {
  const { circuit } = getTestFixture()

  const GLOBAL_FONT_SIZE = 2.5

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      pcbStyle={{
        silkscreenFontSize: GLOBAL_FONT_SIZE,
      }}
    >
      {/* Multiple silkscreen texts without explicit fontSize - should use global size */}
      <silkscreentext pcbX={0} pcbY={0} text="TEXT1" />
      <silkscreentext pcbX={0} pcbY={3} text="TEXT2" />
      <silkscreentext pcbX={0} pcbY={6} text="TEXT3" layer="top" />
      <silkscreentext pcbX={0} pcbY={9} text="TEXT4" layer="bottom" />

      {/* Text with explicit fontSize - should override global size */}
      <silkscreentext pcbX={0} pcbY={12} text="OVERRIDE" fontSize={1.0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  // Find all the manually added silkscreen texts
  const text1 = silkscreenTexts.find((text) => text.text === "TEXT1")
  const text2 = silkscreenTexts.find((text) => text.text === "TEXT2")
  const text3 = silkscreenTexts.find((text) => text.text === "TEXT3")
  const text4 = silkscreenTexts.find((text) => text.text === "TEXT4")
  const overrideText = silkscreenTexts.find((text) => text.text === "OVERRIDE")

  // All texts without explicit fontSize should use the global pcbStyle size
  expect(text1).toBeDefined()
  expect(text1?.font_size).toBe(GLOBAL_FONT_SIZE)

  expect(text2).toBeDefined()
  expect(text2?.font_size).toBe(GLOBAL_FONT_SIZE)

  expect(text3).toBeDefined()
  expect(text3?.font_size).toBe(GLOBAL_FONT_SIZE)

  expect(text4).toBeDefined()
  expect(text4?.font_size).toBe(GLOBAL_FONT_SIZE)

  // Text with explicit fontSize should override global size
  expect(overrideText).toBeDefined()
  expect(overrideText?.font_size).toBe(1.0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
