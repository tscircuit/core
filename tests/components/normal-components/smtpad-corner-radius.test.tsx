import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smtpad cornerRadius sets corner_radius", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="2mm"
              height="1mm"
              portHints={["pin1"]}
              cornerRadius={0.25}
            />
          </footprint>
        }
      />
    </board>,
  )

  project.render()
  expect(project).toMatchPcbSnapshot(import.meta.path)
})
