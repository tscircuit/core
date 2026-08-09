import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor CAD footprinter strings identify supported chip packages", () => {
  const { circuit } = getTestFixture()

  const chipFootprints = [
    "01005",
    "0201",
    "0402",
    "0603",
    "0805",
    "1206",
    "1210",
    "2010",
    "2512",
  ] as const

  circuit.add(
    <board width="10mm" height="10mm">
      {chipFootprints.map((footprint, index) => (
        <capacitor
          key={footprint}
          name={`C${index + 1}`}
          capacitance="1uF"
          footprint={footprint}
          pcbX={index}
        />
      ))}
      <capacitor
        name="C10"
        capacitance="1uF"
        footprint="0402_color(red)"
        pcbX={10}
      />
    </board>,
  )

  circuit.render()

  expect(
    circuit.db.cad_component
      .list()
      .map(({ footprinter_string }) => footprinter_string),
  ).toEqual([
    ...chipFootprints.map((footprint) => `cap${footprint}`),
    "0402_color(red)",
  ])
})
