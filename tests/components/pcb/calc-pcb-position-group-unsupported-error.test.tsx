import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc reports unsupported component-relative references on group", () => {
  const { circuit } = getTestFixture({
    platform: { partsEngineDisabled: true },
  })

  circuit.add(
    <board width={40} height={30} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <group name="G1" pcbX="calc(R1.maxX + 2mm)">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors.map((e) => e.message)).toEqual([
    'Invalid pcbX value for Group: component-relative calc references are not supported for Group; pcbX will be ignored. expression="calc(R1.maxX + 2mm)"',
  ])
})
