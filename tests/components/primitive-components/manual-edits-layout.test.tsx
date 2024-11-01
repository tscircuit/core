import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import manualEdits from "./json/manual-edits.json"

test("Manual edits prop usage", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm" manualEdits={manualEdits}>
      <resistor name="R1" resistance="100" footprint="0402"/>
    </board>,
  )

  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
