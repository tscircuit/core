import { it, expect } from "bun:test"

import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import type { Port } from "lib/components/primitive-components/Port"
import { SmtPad } from "lib/components/primitive-components/SmtPad"

it("should be able to get ports from footprinter string footprint prop", () => {
  const component = new NormalComponent<any>({
    name: "test",
    footprint: "0402",
  })

  component.doInitialPortDiscovery()

  const ports = component.children.filter(
    (c) => c.componentName === "Port",
  ) as Port[]

  expect(ports.map((p) => p.props.name)).toEqual(
    expect.arrayContaining(["pin1", "pin2"]),
  )
})

it("should be able to get ports from Footprint class", () => {
  const footprint = new Footprint({})

  footprint.add(
    new SmtPad({
      pcbX: 0,
      pcbY: 0,
      layer: "top",
      shape: "circle",
      portHints: ["pin1"],
    }),
  )

  const component = new NormalComponent<any>({
    name: "test",
    footprint: footprint,
  })

  component.doInitialPortDiscovery()

  const ports = component.children.filter(
    (c) => c.componentName === "Port",
  ) as Port[]
  console.log(ports)

  expect(ports.map((p) => p.props.name)).toEqual(["pin1"])
})
