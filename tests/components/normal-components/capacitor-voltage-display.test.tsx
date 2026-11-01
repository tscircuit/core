import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor voltage display handles optional, zero and numeric ratings", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board>
      <capacitor name="C1" capacitance="1uF" />
      <capacitor name="C2" capacitance="1uF" maxVoltageRating={0} />
      <capacitor name="C3" capacitance={1e-6} maxVoltageRating={25} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const capacitors = circuit.db.source_component
    .list()
    .filter((sourceComponent) => sourceComponent.ftype === "simple_capacitor")
  expect(
    capacitors.map((capacitor) => ({
      name: capacitor.name,
      display_capacitance: capacitor.display_capacitance,
      display_max_voltage_rating: capacitor.display_max_voltage_rating,
    })),
  ).toEqual([
    {
      name: "C1",
      display_capacitance: "1uF",
      display_max_voltage_rating: undefined,
    },
    {
      name: "C2",
      display_capacitance: "1uF",
      display_max_voltage_rating: "0V",
    },
    {
      name: "C3",
      display_capacitance: "1µF",
      display_max_voltage_rating: "25V",
    },
  ])
})
