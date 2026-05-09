import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

test("createComponentsFromCircuitJson handles pcb_via elements", () => {
  const components = createComponentsFromCircuitJson(
    {
      componentName: "test_component",
      componentRotation: "0",
    },
    [
      {
        type: "pcb_via",
        pcb_via_id: "pcb_via_1",
        x: 1,
        y: 2,
        outer_diameter: 0.8,
        hole_diameter: 0.4,
        from_layer: "top",
        to_layer: "inner1",
        layers: ["top", "inner1"],
        net_is_assignable: true,
        net_assigned: true,
        is_tented: true,
      },
    ] as AnyCircuitElement[],
  )

  const via = components.find((component) => component instanceof PcbVia) as
    | PcbVia
    | undefined

  expect(via).toBeDefined()
  expect(via!._parsedProps.pcbX).toBe(1)
  expect(via!._parsedProps.pcbY).toBe(2)
  expect(via!._parsedProps.outerDiameter).toBe(0.8)
  expect(via!._parsedProps.holeDiameter).toBe(0.4)
  expect(via!._parsedProps.fromLayer).toBe("top")
  expect(via!._parsedProps.toLayer).toBe("inner1")
  expect(via!._parsedProps.layers).toEqual(["top", "inner1"])
  expect(via!._parsedProps.netIsAssignable).toBe(true)
  expect(via!._parsedProps.netAssigned).toBe(true)
  expect(via!._parsedProps.isTented).toBe(true)
})
