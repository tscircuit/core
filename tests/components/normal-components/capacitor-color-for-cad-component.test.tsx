import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor CAD footprinter strings include their body color", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={-1} />
      <capacitor
        name="C2"
        capacitance="1uF"
        footprint="0402_color(red)"
        pcbX={1}
      />
    </board>,
  )

  circuit.render()

  expect(
    circuit.db.cad_component
      .list()
      .map(({ footprinter_string }) => footprinter_string),
  ).toEqual(["0402_color(yellow)", "0402_color(red)"])
})
