import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board title appears in silkscreen", () => {
  const { circuit } = getTestFixture({
    platform: {
      printBoardInformationToSilkscreen: true,
    },
  })

  circuit.add(
    <board width="20mm" height="20mm" title="My Custom Board">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const titleText = silkscreenTexts.find((text) =>
    text.text.includes("My Custom Board"),
  )

  expect(titleText).toBeDefined()
  expect(titleText?.text).toContain("My Custom Board")
  expect(titleText?.layer).toBe("top")
})
