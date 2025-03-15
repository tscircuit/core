import { it, expect, describe } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

describe("Resonator Component", () => {
  it("should render a resonator with no ground pins", async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="10mm">
        <resonator
          name="K1"
          frequency="1MHz"
          loadCapacitance="20pF"
          pinVariant="no_ground"
        />
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(
      import.meta.path + "-resonator-no-ground",
    )
  })

  it("should render a resonator with single ground pin", async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="10mm">
        <resonator
          name="K2"
          frequency="16MHz"
          loadCapacitance="22pF"
          pinVariant="ground_pin"
        />
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(
      import.meta.path + "-resonator-single-ground",
    )
  })

  it("should render a resonator with two ground pins", async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="10mm">
        <resonator
          name="K3"
          frequency="32MHz"
          loadCapacitance="18pF"
          pinVariant="two_ground_pins"
        />
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(
      import.meta.path + "-resonator-two-ground",
    )
  })

  it("should render a resonator without pinVariant specified", async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="10mm">
        <resonator name="K4" frequency="8MHz" loadCapacitance="15pF" />
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(
      import.meta.path + "-resonator-default",
    )
  })
})
