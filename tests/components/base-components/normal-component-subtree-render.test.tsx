import { it, expect } from "bun:test"

import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import type { Port } from "lib/components/primitive-components/Port"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { createReactSubtree } from "lib/fiber/create-react-subtree"

it("should be able to get ports from react footprint definition", () => {
  console.log("calling", <NormalComponent />)

  console.log(createReactSubtree(<NormalComponent />))

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
