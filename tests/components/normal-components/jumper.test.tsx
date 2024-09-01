import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a jumper with pinrow4 footprint", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J1"
        footprint="pinrow4"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />
    </board>,
  )

  project.render()

  console.log(project.selectOne(".J1").children)

  expect(project).toMatchPcbSnapshot(import.meta.path)
  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
