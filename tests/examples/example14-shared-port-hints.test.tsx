import type { CommonLayoutProps } from "@tscircuit/props"
import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("example14-shared-port-hints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="30mm">
      <MyComponent name="U1" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
})

interface Props extends CommonLayoutProps {
  name: string
}

const MyComponent = (props: Props) => {
  return (
    <chip
      {...props}
      footprint={
        <footprint>
          <platedhole
            portHints={["1"]}
            pcbX="-8.89mm"
            pcbY="7.62mm"
            outerDiameter="1.27mm"
            holeDiameter="0.7mm"
            shape="circle"
          />
          <smtpad
            portHints={["1"]}
            pcbX="-8.278mm"
            pcbY="7.62mm"
            width="1.626mm"
            height="1.325mm"
            shape="rect"
          />
        </footprint>
      }
    />
  )
}
