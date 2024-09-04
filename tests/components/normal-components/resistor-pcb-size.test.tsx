import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor PCB component size calculation", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  project.render()

  const pcbComponent = project.db.pcb_component.list()[0]

  expect(pcbComponent).toBeDefined()
  expect(pcbComponent.width).toBeCloseTo(1.6, 1) // 0402 is approximately 1mm long
  expect(pcbComponent.height).toBeCloseTo(0.6, 1) // 0402 is approximately 0.5mm wide
})
