import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc reports error for bare non-calc coordinate strings", () => {
  const { circuit } = getTestFixture({
    platform: { partsEngineDisabled: true },
  })

  circuit.add(
    <board width={40} height={30} routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX="R999.x"
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbLeftEdgeX="R999.maxX + 1mm"
      />
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors.map((e) => e.message)).toEqual([
    'Invalid pcbX value for Resistor: Invalid calc() expression. expression="R999.x"',
    'Invalid pcbLeftEdgeX value for Resistor: Invalid calc() expression. expression="R999.maxX + 1mm"',
  ])
})
