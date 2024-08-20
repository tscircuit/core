import { it, expect } from "bun:test"
import { Resistor } from "lib/components"
import "lib/register-catalogue"

import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import type { Port } from "lib/components/primitive-components/Port"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

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
  component.runRenderPhase("PortDiscovery")
  // console.log("component.children", component.children)
  // console.log("component.children[0].children", component.children[0].children)
  const ports = component.children.filter(
    (c) => c.componentName === "Port",
  ) as Port[]
  console.log(ports)
  expect(ports.length).toBe(1)
  expect(ports[0].props.name).toBe("pin1")
})
