import { expect, test } from "bun:test"
import { Via } from "lib/components/primitive-components/Via"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via defaults reach nested subcircuits but stop at separate physical boards", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel>
      <board
        name="Parent"
        width={30}
        height={20}
        defaultViaTenting="top_tented"
      >
        <subcircuit name="Nested" pcbX={-20}>
          <group name="Inner">
            <via name="Inherited" />
            <via name="Exposed" pcbX={2} tented={false} />
          </group>
        </subcircuit>
        <mountedboard name="Mounted" width={8} height={8} pcbX={5}>
          <via name="MountedUnspecified" />
        </mountedboard>
      </board>
      <board name="Sibling" width={10} height={10}>
        <via name="Unspecified" />
      </board>
      <board
        name="SiblingDefault"
        width={10}
        height={10}
        defaultViaTenting="bottom_tented"
      >
        <via name="OwnDefault" />
      </board>
    </panel>,
  )
  circuit.render()
  expect(circuit.db.pcb_via.list()).toHaveLength(5)
  for (const [name, top, bottom] of [
    ["Inherited", true, false],
    ["Exposed", false, false],
    ["Unspecified", undefined, undefined],
    ["OwnDefault", false, true],
    ["MountedUnspecified", undefined, undefined],
  ] as const) {
    const viaComponent = circuit
      .firstChild!.getDescendants()
      .find(
        (component): component is Via =>
          component instanceof Via && component.name === name,
      )!
    const via = circuit.db.pcb_via.get(viaComponent.pcb_via_id!)!
    expect([via.tented_on_top, via.tented_on_bottom]).toEqual([top, bottom])
  }
})
