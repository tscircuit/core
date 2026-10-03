import { expect, test } from "bun:test"
import { source_missing_manufacturer_part_number_warning } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NormalComponent_doInitialMissingManufacturerPartNumberWarning } from "lib/components/base-components/NormalComponent/NormalComponent_doInitialMissingManufacturerPartNumberWarning"
import type { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"

test("warns once for unresolved parts, accepting MPNs and non-empty supplier numbers", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="parts" subcircuit>
        <chip name="U1" footprint="soic8" />
        <chip name="U2" footprint="soic8" mpn=" " />
        <chip
          name="U3"
          footprint="soic8"
          supplierPartNumbers={{ jlcpcb: ["C123"] }}
        />
        <chip name="R2" footprint="soic8" />
        <chip
          name="U4"
          footprint="soic8"
          supplierPartNumbers={{ jlcpcb: [] }}
        />
        <chip
          name="U5"
          footprint="soic8"
          supplierPartNumbers={{ jlcpcb: [" "] }}
        />
        <diode name="D1" footprint="sod123" />
        <connector
          name="J1"
          footprint="pinrow2"
          pinLabels={{ pin1: "A", pin2: "B" }}
        />
        <resistor name="R1" resistance="10k" footprint="0402" />
        <capacitor name="C1" capacitance="100nF" footprint="0402" />
        <inductor name="L1" inductance="10uH" footprint="0402" />
      </group>
    </board>,
  )
  circuit.render()
  const warnings =
    circuit.db.source_missing_manufacturer_part_number_warning.list()
  expect(warnings).toHaveLength(10)
  const warnedNames = warnings.map((warning) => {
    expect(
      source_missing_manufacturer_part_number_warning.safeParse(warning)
        .success,
    ).toBe(true)
    expect(warning.subcircuit_id).toBeDefined()
    expect(warning.message).toContain(
      "Specify mpn, manufacturerPartNumber, or mfn",
    )
    return circuit.db.source_component.get(warning.source_component_id)?.name
  })
  expect(warnedNames.sort()).toEqual([
    "C1",
    "D1",
    "J1",
    "L1",
    "R1",
    "R2",
    "U1",
    "U2",
    "U4",
    "U5",
  ])
  NormalComponent_doInitialMissingManufacturerPartNumberWarning(
    circuit.selectOne(".parts .U1") as NormalComponent,
  )
  expect(
    circuit.db.source_missing_manufacturer_part_number_warning.list(),
  ).toHaveLength(10)
  const resolvedChip = circuit.selectOne(".parts .U1") as NormalComponent
  circuit.db.source_component.update(resolvedChip.source_component_id!, {
    supplier_part_numbers: { jlcpcb: ["C456"] },
  })
  resolvedChip.updateMissingManufacturerPartNumberWarning()
  expect(
    circuit.db.source_missing_manufacturer_part_number_warning.list(),
  ).toHaveLength(9)
})
