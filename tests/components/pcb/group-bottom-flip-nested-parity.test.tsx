import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two nested bottom-side groups cancel each other's reflection", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" schematicDisabled routingDisabled>
      <group layer="bottom">
        <group layer="bottom">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0603"
            pcbX={4}
            pcbY={1}
            pcbRotation={90}
          />
        </group>
      </group>
    </board>,
  )

  circuit.render()

  const pcb = circuit.db.pcb_component.list()[0]
  expect(pcb.layer).toBe("top")
  expect(pcb.center.x).toBeCloseTo(4)
  expect(pcb.center.y).toBeCloseTo(1)
  expect(pcb.rotation).toBeCloseTo(90)
  expect(
    circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === pcb.pcb_component_id)
      .map((pad) => pad.layer),
  ).toEqual(["top", "top"])
})
