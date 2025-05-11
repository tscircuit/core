import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenText rendering", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <schematictext text="center" schX={2} schY={3} anchor="center" />
      <schematictext
        text="bottom"
        schX={2}
        schY={3}
        anchor="bottom"
        color="red"
      />
      <schematictext
        text="right"
        schX={2}
        schY={3}
        anchor="right"
        color="blue"
      />
      <schematictext
        text="left"
        schX={2}
        schY={3}
        anchor="left"
        color="green"
      />
      <schematictext text="top" schX={2} schY={3} anchor="top" color="yellow" />
    </board>,
  )

  project.render()

  const schematicTexts = project.db.schematic_text.list()

  expect(schematicTexts.length).toBe(5)
  expect(schematicTexts[0].text).toBe("center")
  expect(schematicTexts[0].position.x).toBe(2)
  expect(schematicTexts[0].position.y).toBe(3)
  expect(schematicTexts[0].anchor).toBe("center")

  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
