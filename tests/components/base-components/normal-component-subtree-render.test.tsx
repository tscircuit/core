import { it, expect } from "bun:test"
import "lib/register-catalogue"

import { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Port } from "lib/components/primitive-components/Port"

it("should be able to get ports from react footprint definition", () => {
  const component = new NormalComponent<any>({
    name: "test",
    footprint: (
      <footprint>
        <smtpad
          pcbX={0}
          pcbY={0}
          layer="top"
          shape="rect"
          width="5mm"
          height="5mm"
          portHints={["pin1"]}
        />
      </footprint>
    ),
  })
  component.runRenderPhase("ReactSubtreesRender")
  component.runRenderPhase("PcbFootprintStringRender")
  component.runRenderPhase("InitializePortsFromChildren")

  const ports = component.children.filter(
    (c) => c.componentName === "Port",
  ) as Port[]

  expect(ports.length).toBe(1)
  expect(ports[0].props.name).toBe("pin1")
})
