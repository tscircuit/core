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

  expect(project).toMatchPcbSnapshot(import.meta.path)
})

test("SilkscreenText malformed calc does not throw and reports validation error", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <silkscreentext text="Bad Calc" pcbX="calc board.minX + 1mm)" pcbY={0} />
    </board>,
  )

  project.render()

  const invalidPropertyErrors =
    project.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors.length).toBeGreaterThan(0)

  const message = invalidPropertyErrors
    .filter((element) => "message" in element)
    .map((element) => element.message)
    .join("\n")
  expect(message).toMatchInlineSnapshot(
    `"Invalid pcbX value for SilkscreenText: Invalid calc() expression. expression="calc board.minX + 1mm)""`,
  )

  const silkscreenTexts = project.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts.length).toBe(1)
  expect(silkscreenTexts[0].anchor_position.x).toBe(0)
})
