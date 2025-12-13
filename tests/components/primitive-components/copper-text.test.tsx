import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CopperText rendering", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="15mm" height="10mm">
      <coppertext text="Test Text" fontSize={1.5} anchorAlignment="center" />
      <coppertext
        text="Test Text"
        fontSize={1.5}
        anchorAlignment="center"
        layer="bottom"
        pcbY={-2}
      />
      <coppertext text="KOT1" fontSize={1.5} pcbY={2} knockout={true} />
      <coppertext
        text="KOT2"
        fontSize={1.5}
        pcbY={2}
        pcbX={-3}
        knockout={true}
        pcbRotation={45}
        layer="bottom"
      />
    </board>,
  )

  project.render()

  const copperTexts = project.db.pcb_copper_text.list()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
