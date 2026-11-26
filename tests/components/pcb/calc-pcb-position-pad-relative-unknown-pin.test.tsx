import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc reports unknown pin reference on known component", () => {
  const { circuit } = getTestFixture({
    platform: { partsEngineDisabled: true },
  })

  circuit.add(
    <board width={40} height={30} routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX="calc(U1.pin99.x - 2mm)"
        pcbY="calc(U1.pin1.y)"
      />
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors).toHaveLength(1)
  expect(invalidPropertyErrors[0]?.message).toBe(
    'Invalid pcbX value for Capacitor: Unknown variable: "U1.pin99.x". expression="calc(U1.pin99.x - 2mm)"',
  )
})
