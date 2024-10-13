import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with cadModel positionOffset", () => {
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
          positionOffset: { x: 1, y: 2, z: 3 },
        }}
      />
    </board>
  )

  project.render()

  const cadComponent = project.db.cad_component.list()[0]

  expect(cadComponent).toBeDefined()
  expect(cadComponent.model_stl_url).toBe("https://example.com/chip.stl")
  expect(cadComponent.position).toEqual({
    x: 1,
    y: 2,
    z: expect.closeTo(3.7, 0.1), // 0.7 is half of the default board thickness
  })
})
