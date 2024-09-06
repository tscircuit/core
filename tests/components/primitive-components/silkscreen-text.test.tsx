import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenText rendering", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <silkscreentext
        text="Test Text"
        pcbX={2}
        pcbY={3}
        fontSize={1.5}
        anchorAlignment="center"
      />
    </board>,
  )

  project.render()

  const silkscreenTexts = project.db.pcb_silkscreen_text.list()

  expect(silkscreenTexts.length).toBe(1)
  expect(silkscreenTexts[0].text).toBe("Test Text")
  expect(silkscreenTexts[0].anchor_position.x).toBe(2)
  expect(silkscreenTexts[0].anchor_position.y).toBe(3)
  expect(silkscreenTexts[0].font_size).toBe(1.5)
  expect(silkscreenTexts[0].anchor_alignment).toBe("center")

  Bun.write("test.json", JSON.stringify(silkscreenTexts, null, 2))
  expect(project).toMatchPcbSnapshot(import.meta.path)
})
