import { expect, test } from "bun:test"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

import type { Via } from "lib/components"

const baseConfig = {
  componentName: "TestComponent",
  componentRotation: "0",
  footprinterString: "<footprint></footprint>",
}

test("createComponentsFromCircuitJson handles pcb_via elements", () => {
  const components = createComponentsFromCircuitJson(baseConfig, [
    {
      type: "pcb_via",
      name: "via1",
      x: 1,
      y: 2,
      hole_diameter: 0.3,
      outer_diameter: 0.7,
      layers: ["top", "inner1", "bottom"],
      net_is_assignable: true,
      connects_to: ["net.VCC", "net.GND"],
    } as any,
  ])

  expect(components.length).toBe(1)
  const via = components[0] as Via

  expect(via.props.name).toBe("via1")
  expect(via.componentName).toBe("Via")
  expect(via.props.holeDiameter).toBe(0.3)
  expect(via.props.outerDiameter).toBe(0.7)
  expect(via.props.fromLayer).toBe("top")
  expect(via.props.toLayer).toBe("bottom")
  expect(via.props.netIsAssignable).toBe(true)
  expect(via.props.connectsTo).toEqual(["net.VCC", "net.GND"])
})

test("createComponentsFromCircuitJson handles pcb_via elements with string connects_to", () => {
  const components = createComponentsFromCircuitJson(baseConfig, [
    {
      type: "pcb_via",
      x: -1,
      y: -2,
      hole_diameter: 0.25,
      outer_diameter: 0.55,
      from_layer: "inner1",
      to_layer: "inner2",
      connects_to: "net.3v3",
    } as any,
  ])

  expect(components.length).toBe(1)
  const via = components[0] as Via

  expect(via.props.connectsTo).toBe("net.3v3")
  expect(via.props.fromLayer).toBe("inner1")
  expect(via.props.toLayer).toBe("inner2")
})
