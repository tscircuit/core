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
