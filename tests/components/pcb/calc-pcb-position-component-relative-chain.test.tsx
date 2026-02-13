import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc resolves chained component-relative references", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <resistor name="R1" footprint="0402" resistance="1k" pcbX="0mm" />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        pcbX="calc(R1.maxX + 1mm)"
      />
      <resistor
        name="R3"
        footprint="0402"
        resistance="1k"
        pcbX="calc(R2.maxX + 1mm)"
      />
    </board>,
  )

  circuit.render()

  const sourceComponents = circuit.db.source_component.list()
  const r1Source = sourceComponents.find((component) => component.name === "R1")
  const r2Source = sourceComponents.find((component) => component.name === "R2")
  const r3Source = sourceComponents.find((component) => component.name === "R3")

  const pcbComponents = circuit.db.pcb_component.list()
  const r1 = pcbComponents.find(
    (component) =>
      component.source_component_id === r1Source?.source_component_id,
  )
  const r2 = pcbComponents.find(
    (component) =>
      component.source_component_id === r2Source?.source_component_id,
  )
  const r3 = pcbComponents.find(
    (component) =>
      component.source_component_id === r3Source?.source_component_id,
  )

  expect(r1).toBeDefined()
  expect(r2).toBeDefined()
  expect(r3).toBeDefined()

  expect(r2?.center.x).toBeCloseTo(
    (r1?.center.x ?? 0) + (r1?.width ?? 0) / 2 + 1,
  )
  expect(r3?.center.x).toBeCloseTo(
    (r2?.center.x ?? 0) + (r2?.width ?? 0) / 2 + 1,
  )
  expect((r3?.center.x ?? 0) > (r2?.center.x ?? 0)).toBe(true)
})
