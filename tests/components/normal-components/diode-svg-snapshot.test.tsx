import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode SVG snapshot", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <diode name="D1" footprint="0603" />
    </board>,
  )

  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
