import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Group } from "lib/components/primitive-components/Group/Group"

test("same trace names in sibling subcircuits resolve locally", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={20} routingDisabled>
      {["LEFT", "RIGHT"].map((name, index) => (
        <group
          key={name}
          name={name}
          subcircuit
          pcbX={index * 12 - 6}
          schX={index * 8 - 4}
        >
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={-2}
            schX={-2}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="0402"
            pcbX={2}
            schX={2}
          />
          <trace name="DDR_D0" from=".R1 > .pin1" to=".R2 > .pin1" />
          <autoroutingphase
            name="DDR_FIRST"
            phaseIndex={0}
            connection="DDR_D0"
          />
        </group>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const name of ["LEFT", "RIGHT"]) {
    const group = circuit.firstChild!.children.find(
      (child) => child.props.name === name,
    ) as Group
    const plan = Group_getRoutingPhasePlans(group).find(
      (p) => p.routingPhaseIndex === 0,
    )!
    expect(plan.traces).toHaveLength(1)
    expect(plan.traces[0].getSubcircuit()).toBe(group)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
