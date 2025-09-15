import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with cadModel rotationOffset", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
        cadModel={{
          stlUrl: "https://example.com/chip.stl",
          rotationOffset: { x: 0, y: 0, z: 90 },
        }}
      />
    </board>,
  )

  project.render()

  const cadComponent = project.db.cad_component.list()[0]

  expect(cadComponent).toBeDefined()
  expect(cadComponent.model_stl_url).toBe("https://example.com/chip.stl")
  expect(cadComponent.rotation).toEqual({
    x: 0,
    y: 0,
    z: 90,
  })
})
