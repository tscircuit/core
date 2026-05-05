import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistors normalize generic passive footprints without changing capacitors or LEDs", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-4}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0603" pcbX={0} pcbY={0} />
      <resistor name="R3" resistance="10k" footprint="1206" pcbX={4} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={-4}
        pcbY={4}
      />
      <led name="LED1" footprint="0603" pcbX={0} pcbY={4} />
      <led name="LED2" footprint="1206" pcbX={4} pcbY={4} />
    </board>,
  )

  circuit.render()

  const getCadFootprinterString = (componentName: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((component) => component.name === componentName)

    const cadComponent = circuit.db.cad_component
      .list()
      .find(
        (component) =>
          component.source_component_id ===
          sourceComponent?.source_component_id,
      )

    return cadComponent?.footprinter_string
  }

  expect(getCadFootprinterString("R1")).toBe("res0402")
  expect(getCadFootprinterString("R2")).toBe("res0603")
  expect(getCadFootprinterString("R3")).toBe("res1206")
  expect(getCadFootprinterString("C1")).toBe("0402")
  expect(getCadFootprinterString("LED1")).toBe("0603")
  expect(getCadFootprinterString("LED2")).toBe("1206")
})
