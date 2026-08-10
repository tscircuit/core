import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with a string cadModel URL maps the extension to the matching url field", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
        cadModel="https://example.com/chip.glb"
      />
    </board>,
  )

  project.render()

  const cadComponent = project.db.cad_component.list()[0]

  expect(cadComponent).toBeDefined()
  expect(cadComponent.model_glb_url).toBe("https://example.com/chip.glb")
  expect(cadComponent.model_stl_url).toBeUndefined()
})
