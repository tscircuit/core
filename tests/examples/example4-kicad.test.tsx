import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("example 4: kicad theme demo", async () => {
  const { circuit, logSoup } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        schX={-2}
      />

      <capacitor
        capacitance={"10uF"}
        name="C1"
        footprint="0402"
        pcbX={2}
        schX={2}
      />
      <trace from=".R1 > .pin2" to=".C1 > .pos" />

      <chip
        name="U2"
        manufacturerPartNumber="ATmega8-16A"
        schX={7}
        schWidth={3}
        schHeight={7}
        pinLabels={{
          pin7: "GND",
          pin8: "N_V_P",
        }}
        schPinStyle={{
          pin22: { topMargin: 0.8 },
          pin12: { bottomMargin: 0.5 },
          pin15: { topMargin: 0.8 },
        }}
        schPinArrangement={{
          leftSide: {
            pins: [29, 7, 8, 20, 19, 22],
            direction: "top-to-bottom",
          },
          topSide: {
            direction: "right-to-left",
            pins: [4, 18],
          },
          rightSide: {
            direction: "bottom-to-top",
            pins: [12, 13, 14, 15, 16, 17, 23],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: [2, 3],
          },
        }}
      />
    </board>,
  )

  circuit.render()

  const schChip = circuit.db.schematic_component
    .list()
    .find((sc) => sc.port_arrangement)

  expect(
    circuit.db.schematic_port.getWhere({
      pin_number: 2,
      schematic_component_id: schChip?.schematic_component_id,
    })?.side_of_component,
  ).toEqual("bottom")
  expect(
    circuit.db.schematic_port.getWhere({
      pin_number: 18,
      schematic_component_id: schChip?.schematic_component_id,
    })?.side_of_component,
  ).toEqual("top")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
