import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group rotation composes with local side reflection in PCB space", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" schematicDisabled routingDisabled>
      <group pcbX={2} pcbY={3} pcbRotation={90} layer="bottom">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          pcbX={5}
          pcbY={1}
          pcbRotation={30}
        />
      </group>
    </board>,
  )

  circuit.render()

  const pcb = circuit.db.pcb_component.list()[0]
  expect(pcb.layer).toBe("bottom")
  expect(pcb.center.x).toBeCloseTo(1)
  expect(pcb.center.y).toBeCloseTo(-2)
  expect(pcb.rotation).toBeCloseTo(60)
  expect(
    circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === pcb.pcb_component_id)
      .map((pad) => pad.layer),
  ).toEqual(["bottom", "bottom"])
})
