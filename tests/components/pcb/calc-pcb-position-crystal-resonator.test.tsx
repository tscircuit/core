import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc supports crystal and resonator component-relative references", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <crystal
        name="X1"
        frequency="8MHz"
        loadCapacitance="15pF"
        footprint="0402"
        pcbX="calc(board.minX + 3mm)"
        pcbY="0mm"
      />
      <resonator
        name="Y1"
        frequency="16MHz"
        loadCapacitance="20pF"
        footprint="0402"
        pcbX="calc(X1.maxX + 2mm)"
        pcbY="calc(X1.y)"
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)

  const sourceComponents = circuit.db.source_component.list()
  const x1Source = sourceComponents.find((component) => component.name === "X1")
  const y1Source = sourceComponents.find((component) => component.name === "Y1")

  const pcbComponents = circuit.db.pcb_component.list()
  const x1 = pcbComponents.find(
    (component) =>
      component.source_component_id === x1Source?.source_component_id,
  )
  const y1 = pcbComponents.find(
    (component) =>
      component.source_component_id === y1Source?.source_component_id,
  )

  expect(x1).toBeDefined()
  expect(y1).toBeDefined()
  expect(y1?.center.x).toBeCloseTo(
    (x1?.center.x ?? 0) + (x1?.width ?? 0) / 2 + 2,
  )
  expect(y1?.center.y).toBeCloseTo(x1?.center.y ?? 0)
})
