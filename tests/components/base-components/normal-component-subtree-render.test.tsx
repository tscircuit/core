import { it, expect } from "bun:test"
import { Resistor } from "lib/components"
import "lib/register-catalogue"

import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import type { Port } from "lib/components/primitive-components/Port"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

it("should be able to get ports from react footprint definition", () => {
  const instance = createInstanceFromReactElement(
    <Footprint>
      <SmtPad
        pcbX={0}
        pcbY={0}
        layer="top"
        shape="circle"
        portHints={["pin1"]}
      />
    </Footprint>,
  )
  console.log("\n--------------\n")
  console.log(instance, instance.children)
  // const component = new NormalComponent<any>({
  //   name: "test",
  //   footprint: (
  //     <Footprint>
  //       <SmtPad
  //         pcbX={0}
  //         pcbY={0}
  //         layer="top"
  //         shape="circle"
  //         portHints={["pin1"]}
  //       />
  //     </Footprint>
  //   ),
  // })
  // component.runRenderPhase("ReactSubtreesRender")
  // console.log(component.reactSubtrees[0].component.children)
  // return
  // console.log(component.reactSubtrees)
  // component.runRenderPhase("PortDiscovery")
  // console.log("component.children", component.children)
  // console.log("component.children[0].children", component.children[0].children)
  // const ports = component.children.filter(
  //   (c) => c.componentName === "Port",
  // ) as Port[]
  // console.log(ports)
  // expect(ports.map((p) => p.props.name)).toEqual(
  //   expect.arrayContaining(["pin1", "pin2"]),
  // )
})
