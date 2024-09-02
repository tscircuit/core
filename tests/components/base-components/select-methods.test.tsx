import { it, expect } from "bun:test"
import { Circuit } from "lib/Project"
import "lib/register-catalogue"

it("should correctly use selectAll and selectOne methods", () => {
  const project = new Circuit()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="20k" footprint="0603" />
      <led name="LED1" footprint="0402" />
      <group name="G1">
        <resistor name="R3" resistance="30k" footprint="0805" />
      </group>
    </board>,
  )

  project.render()

  const board = project.rootComponent!

  // Test selectAll
  const allResistors = board.selectAll("resistor")
  expect(allResistors).toHaveLength(3)
  expect(allResistors.map((r) => r.props.name).sort()).toEqual([
    "R1",
    "R2",
    "R3",
  ])

  const resistorInGroup = board.selectAll("group > resistor")
  expect(resistorInGroup).toHaveLength(1)
  expect(resistorInGroup[0].props.name).toBe("R3")

  // Test nested selection without direct child operator
  const nestedResistorAll = board.selectAll("group resistor")
  expect(nestedResistorAll).toHaveLength(1)
  expect(nestedResistorAll.map((r) => r.props.name).sort()).toEqual(["R3"])

  // Test selectOne
  const led = board.selectOne("led")
  expect(led).not.toBeNull()
  expect(led!.props.name).toBe("LED1")

  const nonExistentComponent = board.selectOne("capacitor")
  expect(nonExistentComponent).toBeNull()

  // Test complex selectors
  const r2 = board.selectOne("resistor[name='R2']")
  expect(r2).not.toBeNull()
  expect(r2!.props.resistance).toBe("20k")

  const groupedResistor = board.selectOne("group[name='G1'] > resistor")
  expect(groupedResistor).not.toBeNull()
  expect(groupedResistor!.props.resistance).toBe("30k")
})
