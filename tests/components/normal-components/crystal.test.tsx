import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a two-pin crystal", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <crystal
        name="X1"
        frequency="1MHz"
        loadCapacitance="20pF"
        pinVariant="two_pin"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-crystal-two-pin",
  )
})

it("should render a four-pin crystal", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <crystal
        name="X2"
        frequency="16MHz"
        loadCapacitance="22pF"
        pinVariant="four_pin"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-crystal-four-pin",
  )
})

it("should render a crystal without pinVariant specified (default to two-pin)", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <crystal name="X3" frequency="8MHz" loadCapacitance="15pF" />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-crystal-default",
  )
})
