import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic text preserves full and partial overlines", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="8mm" height="4mm">
      <schematictext
        text={[{ text: "FULL OVERLINE", overline: true }]}
        fontSize={0.5}
        schY={0.75}
      />
      <schematictext
        text={[{ text: "FB/" }, { text: "INT", overline: true }]}
        fontSize={0.5}
        schY={-0.75}
      />
    </board>,
  )

  project.render()

  expect(
    project.db.schematic_text.list().map((schematicText) => ({
      text: schematicText.text,
      textParts: schematicText.text_parts,
    })),
  ).toEqual([
    {
      text: "FULL OVERLINE",
      textParts: [{ text: "FULL OVERLINE", is_overlined: true }],
    },
    {
      text: "FB/INT",
      textParts: [{ text: "FB/" }, { text: "INT", is_overlined: true }],
    },
  ])
  expect(project).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})
