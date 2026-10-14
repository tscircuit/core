import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Group } from "lib/components/primitive-components/Group/Group"

test("same trace names in sibling subcircuits resolve locally", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={38} height={18} autorouter="local">
      <pcbnotetext
        text="Same trace name, independent subcircuits"
        pcbY={7}
        fontSize={1}
      />
      <pcbnotetext
        text='Each phase selects only its local "DDR_D0"'
        pcbY={5.5}
        fontSize={0.75}
      />
      <pcbnoteline x1={0} y1={4} x2={0} y2={-5} isDashed />
      <pcbnotetext
        text="No cross-subcircuit selection or connection"
        pcbY={-7}
        fontSize={0.75}
      />
      {["LEFT", "RIGHT"].map((name, index) => (
        <group
          key={name}
          name={name}
          subcircuit
          pcbX={index * 18 - 9}
          schX={index * 8 - 4}
        >
          <pcbnotetext text={name} pcbY={3.5} fontSize={1} />
          <pcbnotetext text="DDR_D0" pcbY={1} fontSize={0.8} />
          <pcbnotetext text="Phase 0: DDR_FIRST" pcbY={-2.5} fontSize={0.7} />
          <pcbnotetext
            text="1 local trace selected"
            pcbY={-4}
            fontSize={0.65}
          />
          <resistor
            name="R1"
            resistance="1k"
            footprint="1206"
            pcbX={-4}
            schX={-2}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="1206"
            pcbX={4}
            schX={2}
          />
          <trace name="DDR_D0" from=".R1 > .pin2" to=".R2 > .pin1" />
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
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showDebugObjects: false,
  })
})
