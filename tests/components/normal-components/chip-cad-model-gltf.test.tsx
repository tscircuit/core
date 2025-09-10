import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with cadModel gltfUrl", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
        cadModel={{
          gltfUrl: "https://example.com/chip.gltf",
          modelUnitToMmScale: 123,
        }}
      />
    </board>,
  )

  project.render()

  const cadComponent = project.db.cad_component.list()[0]

  expect(cadComponent).toBeDefined()
  expect(cadComponent.model_gltf_url).toBe("https://example.com/chip.gltf")
  expect(cadComponent.model_stl_url).toBeUndefined()
  expect(cadComponent.model_obj_url).toBeUndefined()
  expect(cadComponent.model_unit_to_mm_scale_factor).toBe(123)
})
