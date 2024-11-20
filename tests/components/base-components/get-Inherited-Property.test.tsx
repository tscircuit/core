import { it, expect } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { Circuit } from "lib/Circuit"
import "lib/register-catalogue"

it("should correctly use selectAll and selectOne methods", () => {
  const project = new Circuit()

  project.add(
    <board width="10mm" height="10mm" minTraceWidth={0.2}>
      <group name="G1">
        <chip name="U1" />
      </group>
    </board>,
  )

  project.render()

  const chip = project.selectOne("chip") as Chip

  expect(chip.getInheritedProperty("minTraceWidth")).toBe(0.2)
})
