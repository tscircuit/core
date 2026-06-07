import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { Hole } from "lib/components/primitive-components/Hole"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

test("createComponentsFromCircuitJson handles oval pcb_hole elements", () => {
  const components = createComponentsFromCircuitJson(
    {
      componentName: "test_component",
      componentRotation: "0",
    },
    [
      {
        type: "pcb_hole",
        pcb_hole_id: "pcb_hole_1",
        hole_shape: "oval",
        hole_width: 2,
        hole_height: 4,
        x: 1,
        y: 2,
      },
    ] as AnyCircuitElement[],
  )

  const hole = components.find((component) => component instanceof Hole) as
    | Hole
    | undefined

  expect(hole).toBeDefined()
  expect(hole!._parsedProps.shape).toBe("oval")
  expect(hole!._parsedProps.pcbX).toBe(1)
  expect(hole!._parsedProps.pcbY).toBe(2)
  expect((hole!._parsedProps as any).width).toBe(2)
  expect((hole!._parsedProps as any).height).toBe(4)
})
