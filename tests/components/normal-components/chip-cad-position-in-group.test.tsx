import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip CAD component position inside offset group", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <group pcbX={5} pcbY={3}>
        <chip
          name="U1"
          footprint="soic8"
          cadModel={{
            stlUrl: "https://example.com/chip.stl",
          }}
        />
      </group>
    </board>,
  )

  project.render()

  const cadComponent = project.db.cad_component.list()[0]
  const pcbComponent = project.db.pcb_component.list()[0]

  expect(cadComponent).toBeDefined()
  expect(pcbComponent).toBeDefined()

  expect(pcbComponent.center.x).toBeCloseTo(5, 1)
  // The CAD component position should include the group's offset
  expect(cadComponent.position.x).toBeCloseTo(5, 1)
  expect(cadComponent.position.y).toBeCloseTo(3, 1)
  expect(cadComponent.position.z).toBeCloseTo(0.7, 1) // Default board thickness/2
})
