import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader mating-side aliases consistently set PCB and CAD layers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <pinheader name="J1" pinCount={2} pcbX={-4} connectsFromAbove />
      <pinheader name="J2" pinCount={2} pcbX={4} connectsFromBelow />
    </board>,
  )

  await circuit.renderUntilSettled()

  const getPcbAndCadComponents = (name: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((component) => component.name === name)
    if (!sourceComponent) throw new Error(`Missing source component ${name}`)

    const pcbComponent = circuit.db.pcb_component
      .list()
      .find(
        (component) =>
          component.source_component_id === sourceComponent.source_component_id,
      )
    const cadComponent = circuit.db.cad_component
      .list()
      .find(
        (component) =>
          component.source_component_id === sourceComponent.source_component_id,
      )
    if (!pcbComponent || !cadComponent) {
      throw new Error(`Missing PCB or CAD component for ${name}`)
    }

    return { pcbComponent, cadComponent }
  }

  const above = getPcbAndCadComponents("J1")
  expect(above.pcbComponent.layer).toBe("top")
  expect(above.cadComponent.position.z).toBeGreaterThan(0)
  expect(above.cadComponent.rotation?.y).toBe(0)

  const below = getPcbAndCadComponents("J2")
  expect(below.pcbComponent.layer).toBe("bottom")
  expect(below.cadComponent.position.z).toBeLessThan(0)
  expect(below.cadComponent.rotation?.y).toBe(180)
})
