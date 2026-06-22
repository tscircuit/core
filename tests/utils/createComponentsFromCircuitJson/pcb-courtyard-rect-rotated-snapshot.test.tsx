import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("createComponentsFromCircuitJson preserves imported pcb_courtyard_rect rotation", () => {
  const { circuit } = getTestFixture()
  const footprint = new Footprint({})

  const importedComponents = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
    },
    [
      {
        type: "pcb_courtyard_rect",
        pcb_courtyard_rect_id: "pcb_courtyard_rect_0",
        center: { x: 0, y: 0 },
        width: 2,
        height: 1,
        ccw_rotation: 45,
        layer: "top",
      },
    ] as AnyCircuitElement[],
  )

  for (const component of importedComponents) {
    footprint.add(component)
  }

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" layer="top" footprint={footprint as any} />
    </board>,
  )

  circuit.render()

  const pcbCourtyardRects = circuit.db.pcb_courtyard_rect.list()

  expect(pcbCourtyardRects).toHaveLength(1)
  expect(pcbCourtyardRects[0]?.ccw_rotation).toBe(45)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
