import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<transistor /> propagates supplierPartNumbers and manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <transistor
        name="Q1"
        type="npn"
        supplierPartNumbers={{ jlcpcb: ["C20526"] }}
        manufacturerPartNumber="MMBT3904"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "Q1",
  })

  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C20526"],
  })
  expect(sourceComponent?.manufacturer_part_number).toBe("MMBT3904")
})

test("<crystal /> propagates supplierPartNumbers and manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <crystal
        name="X1"
        frequency="16MHz"
        loadCapacitance="12pF"
        supplierPartNumbers={{ jlcpcb: ["C13738"] }}
        manufacturerPartNumber="X322516MLB4SI"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "X1",
  })

  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C13738"],
  })
  expect(sourceComponent?.manufacturer_part_number).toBe("X322516MLB4SI")
})

test("<fuse /> propagates supplierPartNumbers and manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <fuse
        name="F1"
        currentRating="500mA"
        voltageRating="13.2V"
        supplierPartNumbers={{ jlcpcb: ["C20799"] }}
        manufacturerPartNumber="SMD1206P050TF"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "F1",
  })

  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C20799"],
  })
  expect(sourceComponent?.manufacturer_part_number).toBe("SMD1206P050TF")
})

test("<potentiometer /> propagates supplierPartNumbers and manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <potentiometer
        name="R1"
        maxResistance="10k"
        supplierPartNumbers={{ jlcpcb: ["C34846"] }}
        manufacturerPartNumber="3296W-1-103LF"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "R1",
  })

  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C34846"],
  })
  expect(sourceComponent?.manufacturer_part_number).toBe("3296W-1-103LF")
})

test("<interconnect /> propagates supplierPartNumbers and manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <interconnect
        name="J1"
        standard="0603"
        supplierPartNumbers={{ jlcpcb: ["C21189"] }}
        manufacturerPartNumber="0603WAF0000T5E"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "J1",
  })

  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C21189"],
  })
  expect(sourceComponent?.manufacturer_part_number).toBe("0603WAF0000T5E")
})
