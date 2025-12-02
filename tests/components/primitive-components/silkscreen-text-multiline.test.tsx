import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenText with escaped newline characters", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <silkscreentext
        text={"Top\\nLeft"}
        pcbX={2}
        pcbY={3}
        fontSize={1}
        anchorAlignment="center"
      />
    </board>,
  )

  project.render()

  const silkscreenTexts = project.db.pcb_silkscreen_text.list()

  expect(silkscreenTexts.length).toBe(1)
  // The escaped "\n" should be converted to an actual newline character
  expect(silkscreenTexts[0].text).toBe("Top\nLeft")
  expect(silkscreenTexts[0].text).toContain("\n")

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
