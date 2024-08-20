import { it, expect } from "bun:test"
import { Resistor } from "lib/components"
import "lib/register-catalogue"

import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import type { Port } from "lib/components/primitive-components/Port"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

it("should be able to get ports from react footprint definition", () => {
  const subtree = createInstanceFromReactElement(
    <Resistor resistance="10k" name="R1" />,
  )

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

  // console.log(component.reactSubtrees)

  // const ports = component.children.filter(
  //   (c) => c.componentName === "Port",
  // ) as Port[]

  // expect(ports.map((p) => p.props.name)).toEqual(
  //   expect.arrayContaining(["pin1", "pin2"]),
  // )
})
