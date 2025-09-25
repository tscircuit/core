import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen text with per-side knockout padding", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <silkscreentext
        text="CUSTOM PAD"
        pcbX={15}
        pcbY={10}
        fontSize="1.5mm"
        isKnockout={true}
        knockoutPaddingLeft="0.3mm"
        knockoutPaddingRight="0.3mm"
        knockoutPaddingTop="0.5mm"
        knockoutPaddingBottom="0.5mm"
      />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const text = silkscreenTexts[0]

  expect(text.knockout_padding).toEqual({
    left: 0.3,
    right: 0.3,
    top: 0.5,
    bottom: 0.5,
  })
})
