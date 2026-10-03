import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("all part types preserve each MPN alias in source JSON without missing-MPN warnings", async () => {
  for (const alias of ["mpn", "mfn", "manufacturerPartNumber"] as const) {
    const { circuit } = getTestFixture()
    const partNumber = { [alias]: "TEST-MPN" }
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint="soic8" {...partNumber} />
        <connector
          name="J1"
          footprint="pinrow2"
          pinLabels={{ pin1: "A", pin2: "B" }}
          {...partNumber}
        />
        <transistor name="Q1" type="npn" footprint="sot23" {...partNumber} />
        <mosfet
          name="Q2"
          channelType="n"
          mosfetMode="enhancement"
          footprint="sot23"
          {...partNumber}
        />
        <diode name="D1" footprint="sod123" {...partNumber} />
        <led name="D2" footprint="0402" {...partNumber} />
        <resistor name="R1" resistance="10k" footprint="0402" {...partNumber} />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          {...partNumber}
        />
        <inductor
          name="L1"
          inductance="10uH"
          footprint="0402"
          {...partNumber}
        />
        <crystal
          name="Y1"
          frequency="16MHz"
          loadCapacitance="10pF"
          footprint="0402"
          {...partNumber}
        />
        <resonator
          name="Y2"
          frequency="16MHz"
          loadCapacitance="10pF"
          footprint="0402"
          {...partNumber}
        />
        <fuse name="F1" currentRating="1A" footprint="0402" {...partNumber} />
        <switch name="SW1" footprint="0402" {...partNumber} />
        <pushbutton name="SW2" footprint="0402" {...partNumber} />
        <pinheader name="J2" pinCount={2} pitch="2.54mm" {...partNumber} />
        <jumper name="JP1" footprint="pinrow2" {...partNumber} />
        <solderjumper name="JP2" pinCount={2} {...partNumber} />
        <pinout
          name="J3"
          pinLabels={{ pin1: "A", pin2: "B" }}
          {...partNumber}
        />
        <testpoint name="TP1" {...partNumber} />
        <potentiometer
          name="RV1"
          maxResistance="10k"
          footprint="sot23"
          {...partNumber}
        />
        <interconnect
          name="ICN1"
          footprint="0402"
          pinLabels={{ 1: "A", 2: "B" }}
          {...partNumber}
        />
        <opamp name="U2" footprint="soic8" {...partNumber} />
        <battery
          name="B1"
          voltage="3V"
          capacity="1000mAh"
          footprint="0402"
          {...partNumber}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const sourceComponents = circuit.db.source_component.list()
    expect(sourceComponents.map((c) => c.name).sort()).toEqual(
      [
        "U1",
        "J1",
        "Q1",
        "Q2",
        "D1",
        "D2",
        "R1",
        "C1",
        "L1",
        "Y1",
        "Y2",
        "F1",
        "SW1",
        "SW2",
        "J2",
        "JP1",
        "JP2",
        "J3",
        "TP1",
        "RV1",
        "ICN1",
        "U2",
        "B1",
      ].sort(),
    )
    for (const sourceComponent of sourceComponents) {
      expect(sourceComponent.manufacturer_part_number).toBe("TEST-MPN")
    }
    expect(
      circuit.db.source_missing_manufacturer_part_number_warning.list(),
    ).toHaveLength(0)
  }
})
