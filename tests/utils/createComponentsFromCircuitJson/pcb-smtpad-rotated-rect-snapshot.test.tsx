import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbSmtPadRotatedRect } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("createComponentsFromCircuitJson renders imported rotated_rect smtpads", () => {
  const { circuit } = getTestFixture()
  const footprint = new Footprint({})

  const importedComponents = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
    },
    [
      {
        type: "pcb_smtpad",
        shape: "rotated_rect",
        pcb_smtpad_id: "pcb_smtpad_0",
        x: 0,
        y: 0,
        width: 2,
        height: 1,
        ccw_rotation: 45,
        corner_radius: 0.2,
        layer: "top",
        port_hints: ["pin1"],
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

  // const rotatedPads = circuit.db.pcb_smtpad
  //   .list()
  //   .filter(
  //     (element): element is PcbSmtPadRotatedRect =>
  //       element.type === "pcb_smtpad" && element.shape === "rotated_rect",
  //   )

  // expect(rotatedPads).toHaveLength(1)
  // expect(rotatedPads[0].ccw_rotation).toBe(45)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
