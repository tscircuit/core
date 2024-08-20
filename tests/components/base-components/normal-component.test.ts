import { it, expect } from "bun:test"

import { NormalComponent } from "lib/components/base-components/NormalComponent"

it("should be able to get ports from footprint", () => {
  const component = new NormalComponent<any>({
    name: "test",
    footprint: "0402",
  })

  expect(component.getPortsFromFootprint().map((p) => p.props.name)).toEqual(
    expect.arrayContaining(["pin1", "pin2"]),
  )
})
