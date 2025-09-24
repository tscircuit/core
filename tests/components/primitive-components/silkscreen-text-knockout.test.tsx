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
    </board>
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts).toHaveLength(1)
  
  const text = silkscreenTexts[0]
  expect(text.text).toBe("VIN 3-5V")
  expect(text.is_knockout).toBe(true)
  expect(text.knockout_padding).toEqual({
    left: "0.5mm",
    right: "0.5mm",
    top: "0.5mm",
    bottom: "0.5mm"
  })
})

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
    </board>
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const text = silkscreenTexts[0]
  
  expect(text.knockout_padding).toEqual({
    left: "0.3mm",
    right: "0.3mm",
    top: "0.5mm",
    bottom: "0.5mm"
  })
})

test("silkscreen text with enhanced knockout features", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <silkscreentext
        text="ROUNDED"
        pcbX={10}
        pcbY={5}
        fontSize="2mm"
        isKnockout={true}
        knockoutPadding="0.8mm"
        knockoutCornerRadius="0.3mm"
      />
      <silkscreentext
        text="BORDERED"
        pcbX={10}
        pcbY={10}
        fontSize="2mm"
        isKnockout={true}
        knockoutPadding="0.6mm"
        knockoutBorderWidth="0.1mm"
      />
      <silkscreentext
        text="COLORED"
        pcbX={10}
        pcbY={15}
        fontSize="2mm"
        isKnockout={true}
        knockoutPadding="0.5mm"
        knockoutColor="#FFD700"
      />
    </board>
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts).toHaveLength(3)

  // Check rounded corners
  expect(silkscreenTexts[0].knockout_corner_radius).toBe("0.3mm")

  // Check border width
  expect(silkscreenTexts[1].knockout_border_width).toBe("0.1mm")

  // Check custom color
  expect(silkscreenTexts[2].knockout_color).toBe("#FFD700")
})

test("silkscreen text knockout disabled by default", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <silkscreentext
        text="NORMAL TEXT"
        pcbX={10}
        pcbY={10}
        fontSize="2mm"
      />
    </board>
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const text = silkscreenTexts[0]
  
  expect(text.is_knockout).toBe(false)
  expect(text.knockout_padding).toBeUndefined()
})