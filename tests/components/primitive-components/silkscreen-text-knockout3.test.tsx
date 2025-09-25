import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen text knockout disabled by default", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <silkscreentext text="NORMAL TEXT" pcbX={10} pcbY={10} fontSize="2mm" />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const text = silkscreenTexts[0]

  expect(text.is_knockout).toBe(false)
  expect(text.knockout_padding).toBeUndefined()
})