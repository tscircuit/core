import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pcbX calc(board.*) resolves when component is attached to board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX="calc(board.maxX - 1mm)"
        pcbY="0mm"
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)

  const sourceComponent = circuit.db.source_component
    .list()
    .find((component) => component.name === "U1")
  const pcbComponent = circuit.db.pcb_component
    .list()
    .find(
      (component) =>
        component.source_component_id === sourceComponent?.source_component_id,
    )

  expect(pcbComponent?.center.x).toBeCloseTo(9)
  expect(pcbComponent?.center.y).toBeCloseTo(0)
})
