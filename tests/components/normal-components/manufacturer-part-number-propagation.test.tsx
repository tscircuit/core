import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verifies manufacturerPartNumber is propagated to source_component
// for components that were dropping this field.
test("<opamp /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <opamp
        name="U1"
        manufacturerPartNumber="LM358"
        supplierPartNumbers={{ jlcpcb: ["C123"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "U1" })
      ?.manufacturer_part_number,
  ).toBe("LM358")
})

test("<powersource /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <powersource
        name="P1"
        voltage="5"
        manufacturerPartNumber="PS-1234"
        supplierPartNumbers={{ jlcpcb: ["C456"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "P1" })
      ?.manufacturer_part_number,
  ).toBe("PS-1234")
})

test("<ammeter /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <ammeter
        name="A1"
        manufacturerPartNumber="AM-5678"
        supplierPartNumbers={{ jlcpcb: ["C789"] }}
        connections={{ pos: ".V1+.pin1", neg: ".V1-.pin2" }}
      />
      <voltagesource name="V1" voltage="5" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "A1" })
      ?.manufacturer_part_number,
  ).toBe("AM-5678")
})

test("<inductor /> manufacturerPartNumber propagation via mfn alias", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <inductor
        name="L1"
        inductance="10"
        footprint="axial_p0.3in"
        mfn="SRP1234"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "L1" })
      ?.manufacturer_part_number,
  ).toBe("SRP1234")
})

test("<currentsource /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <currentsource
        name="I1"
        current="0.5"
        manufacturerPartNumber="CS-9012"
        supplierPartNumbers={{ jlcpcb: ["C345"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "I1" })
      ?.manufacturer_part_number,
  ).toBe("CS-9012")
})

test("<pushbutton /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <pushbutton
        name="SW1"
        manufacturerPartNumber="PB-3456"
        supplierPartNumbers={{ jlcpcb: ["C678"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "SW1" })
      ?.manufacturer_part_number,
  ).toBe("PB-3456")
})

test("<voltagesource /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <voltagesource
        name="V1"
        voltage="3.3"
        manufacturerPartNumber="VS-7890"
        supplierPartNumbers={{ jlcpcb: ["C901"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "V1" })
      ?.manufacturer_part_number,
  ).toBe("VS-7890")
})

test("<testpoint /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <testpoint
        name="TP1"
        manufacturerPartNumber="TP-2345"
        supplierPartNumbers={{ jlcpcb: ["C234"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "TP1" })
      ?.manufacturer_part_number,
  ).toBe("TP-2345")
})

test("<pinheader /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader
        name="J1"
        pinCount={2}
        manufacturerPartNumber="PH-5678"
        supplierPartNumbers={{ jlcpcb: ["C567"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "J1" })
      ?.manufacturer_part_number,
  ).toBe("PH-5678")
})

test("<battery /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <battery
        name="BT1"
        manufacturerPartNumber="BAT-8901"
        supplierPartNumbers={{ jlcpcb: ["C890"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "BT1" })
      ?.manufacturer_part_number,
  ).toBe("BAT-8901")
})
