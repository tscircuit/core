import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor metric footprints normalize to resistor-specific aliases", () => {
  const supportedAliases = [
    "01005",
    "0201",
    "0402",
    "0603",
    "0805",
    "1206",
    "1210",
    "1812",
    "2010",
    "2512",
  ]

  for (const footprint of supportedAliases) {
    const { circuit } = getTestFixture()
    const expectedFootprinterString = `res${footprint}`

    circuit.add(
      <board width="10mm" height="10mm">
        <resistor
          name="R1"
          resistance="10k"
          footprint={footprint}
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    circuit.render()

    const resistor = circuit.selectOne(".R1") as any
    expect(resistor.getFootprinterString()).toBe(expectedFootprinterString)

    const cadComponent = circuit.db.cad_component.list()[0]
    expect(cadComponent?.footprinter_string).toBe(expectedFootprinterString)
  }
})
