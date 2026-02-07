import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen text with knockout", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <silkscreentext
        text="KNOCKOUT"
        pcbX={0}
        pcbY={0}
        fontSize={1}
        isKnockout={true}
      />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts.length).toBe(1)
  expect(silkscreenTexts[0]?.is_knockout).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("silkscreen text with uniform knockout padding", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <silkscreentext
        text="PAD"
        pcbX={0}
        pcbY={0}
        fontSize={1}
        isKnockout={true}
        knockoutPadding="0.5mm"
      />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts.length).toBe(1)
  expect(silkscreenTexts[0]?.is_knockout).toBe(true)
  const padding = silkscreenTexts[0]?.knockout_padding
  expect(padding?.left).toBeCloseTo(0.5, 1)
  expect(padding?.right).toBeCloseTo(0.5, 1)
  expect(padding?.top).toBeCloseTo(0.5, 1)
  expect(padding?.bottom).toBeCloseTo(0.5, 1)
})
