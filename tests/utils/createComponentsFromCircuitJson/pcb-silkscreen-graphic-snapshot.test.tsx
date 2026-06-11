import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("createComponentsFromCircuitJson renders pcb_silkscreen_graphic elements in PCB snapshots", async () => {
  const components = createComponentsFromCircuitJson(
    {
      componentName: "imported_silkscreen_graphic",
      componentRotation: "0",
    },
    [
      {
        type: "pcb_silkscreen_graphic",
        pcb_silkscreen_graphic_id: "pcb_silkscreen_graphic_0",
        pcb_component_id: "pcb_component_0",
        layer: "top",
        shape: "brep",
        brep_shape: {
          outer_ring: {
            vertices: [
              { x: -7, y: -2 },
              { x: -3, y: -2 },
              { x: -3, y: 2 },
              { x: -7, y: 2 },
            ],
          },
          inner_rings: [
            {
              vertices: [
                { x: -6, y: -1 },
                { x: -4, y: -1 },
                { x: -4, y: 1 },
                { x: -6, y: 1 },
              ],
            },
          ],
        },
      },
      {
        type: "pcb_silkscreen_graphic",
        pcb_silkscreen_graphic_id: "pcb_silkscreen_graphic_1",
        pcb_component_id: "pcb_component_0",
        layer: "bottom",
        shape: "brep",
        brep_shape: {
          outer_ring: {
            vertices: [
              { x: 3, y: 0 },
              { x: 5, y: -2 },
              { x: 7, y: 0 },
              { x: 5, y: 2 },
            ],
          },
          inner_rings: [],
        },
      },
    ] as AnyCircuitElement[],
  )

  const { circuit } = getTestFixture()
  circuit.add(<board width="20mm" height="12mm" />)

  const board = circuit.children[0]!

  for (const component of components) {
    board.add(component)
  }

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const silkscreenGraphics = circuitJson.filter(
    (elm) => elm.type === "pcb_silkscreen_graphic",
  )

  expect(components).toHaveLength(2)
  expect(silkscreenGraphics).toHaveLength(2)
  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
