import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "capacitor source display separates capacitance and voltage",
  async () => {
    const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
    circuit.add(
      <board>
        <capacitor
          name="C21"
          capacitance="4.7uF"
          maxVoltageRating="50V"
          schShowRatings
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const capacitor = circuit.db.source_component
      .list()
      .find((sourceComponent) => sourceComponent.ftype === "simple_capacitor")
    expect(capacitor).toMatchObject({
      capacitance: 4.7e-6,
      max_voltage_rating: 50,
      display_capacitance: "4.7uF",
      display_max_voltage_rating: "50V",
    })
    expect(circuit.db.schematic_component.list()[0].symbol_display_value).toBe(
      "4.7uF/50V",
    )
  },
)
