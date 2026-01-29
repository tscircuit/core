import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("should render a power source", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <powersource name="pwr" voltage={5} schX={2} schY={3} pcbX={0} pcbY={0} />
    </board>,
  )

  project.render()
  expect(project.db.schematic_component.list()).toHaveLength(1)
  expect(project.db.schematic_port.list()).toHaveLength(2)
  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
