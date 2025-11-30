import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getCapacitorSymbols = (
  circuit: ReturnType<typeof getTestFixture>["circuit"],
) =>
  circuit.db.schematic_component
    .list()
    .filter((component) => component.symbol_name?.startsWith("capacitor"))
    .map((component) => component.symbol_name)

test("capacitors default to vertical orientation when schStyle is unset", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C1" capacitance="1uF" />
    </board>,
  )

  circuit.render()

  expect(getCapacitorSymbols(circuit)).toEqual(["capacitor_down"])
})

test("schStyle.defaultCapacitorOrientation='none' keeps capacitor orientation unchanged", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      schStyle={{ defaultCapacitorOrientation: "none" }}
    >
      <capacitor name="C1" capacitance="1uF" />
    </board>,
  )

  circuit.render()

  expect(getCapacitorSymbols(circuit)).toEqual(["capacitor_right"])
})

test("schStyle.defaultCapacitorOrientation inherits through groups", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      schStyle={{ defaultCapacitorOrientation: "none" }}
    >
      <group schStyle={{ defaultCapacitorOrientation: "vertical" }}>
        <capacitor name="C1" capacitance="1uF" />
      </group>
    </board>,
  )

  circuit.render()

  expect(getCapacitorSymbols(circuit)).toEqual(["capacitor_down"])
})
