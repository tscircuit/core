import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistors and capacitors are auto-named R1, R2, C1, C2 etc", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      {/* @ts-expect-error - name is not required */}
      <resistor resistance={1000} footprint="0402" />
      {/* @ts-expect-error - name is not required */}
      <resistor resistance={1000} footprint="0402" />
      {/* @ts-expect-error - name is not required */}
      <resistor resistance={1000} footprint="0402" />
      {/* @ts-expect-error - name is not required */}
      <capacitor capacitance="10uF" footprint="0402" />
      {/* @ts-expect-error - name is not required */}
      <capacitor capacitance="10uF" footprint="0402" />
    </board>,
  )

  circuit.render()

  const sourceComponents = circuit.db.source_component.list()

  const resistorNames = sourceComponents
    .filter((c) => c.ftype === "simple_resistor")
    .map((c) => c.name)
  const capacitorNames = sourceComponents
    .filter((c) => c.ftype === "simple_capacitor")
    .map((c) => c.name)

  expect(resistorNames).toEqual(["R1", "R2", "R3"])
  expect(capacitorNames).toEqual(["C1", "C2"])
})

test("auto-naming skips manually assigned names", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R1" resistance={1000} footprint="0402" />
      {/* @ts-expect-error - name is not required */}
      <resistor resistance={1000} footprint="0402" />
      {/* @ts-expect-error - name is not required */}
      <resistor resistance={1000} footprint="0402" />
      <capacitor name="C2" capacitance="10uF" footprint="0402" />
      {/* @ts-expect-error - name is not required */}
      <capacitor capacitance="10uF" footprint="0402" />
    </board>,
  )

  circuit.render()

  const sourceComponents = circuit.db.source_component.list()

  const resistorNames = sourceComponents
    .filter((c) => c.ftype === "simple_resistor")
    .map((c) => c.name)
  const capacitorNames = sourceComponents
    .filter((c) => c.ftype === "simple_capacitor")
    .map((c) => c.name)

  expect(resistorNames).toContain("R1")
  expect(resistorNames).toContain("R2")
  expect(resistorNames).toContain("R3")
  expect(capacitorNames).toContain("C2")
  expect(capacitorNames).toContain("C1")
})
