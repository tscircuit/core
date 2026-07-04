import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("source_refdes_convention_warning is emitted for mismatched ftype refdes prefix", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="C1" resistance="10k" />
      <capacitor name="C2" capacitance="100nF" />
      <diode name="R1" />
    </board>,
  )

  circuit.render()

  const resistor = circuit.db.source_component.getWhere({ name: "C1" })!
  const diode = circuit.db.source_component.getWhere({ name: "R1" })!
  const warnings = (circuit.db as any).source_refdes_convention_warning.list()

  expect(warnings).toHaveLength(2)
  expect(warnings).toContainEqual(
    expect.objectContaining({
      type: "source_refdes_convention_warning",
      warning_type: "source_refdes_convention_warning",
      message:
        'Component C1 has ftype="simple_resistor" but reference designator should start with R',
      source_component_id: resistor.source_component_id,
      refdes: "C1",
      source_component_ftype: "simple_resistor",
      expected_prefixes: ["R"],
      actual_prefix: "C",
    }),
  )
  expect(warnings).toContainEqual(
    expect.objectContaining({
      type: "source_refdes_convention_warning",
      warning_type: "source_refdes_convention_warning",
      message:
        'Component R1 has ftype="simple_diode" but reference designator should start with D',
      source_component_id: diode.source_component_id,
      refdes: "R1",
      source_component_ftype: "simple_diode",
      expected_prefixes: ["D"],
      actual_prefix: "R",
    }),
  )
  expect(warnings[0]).toMatchObject({
    type: "source_refdes_convention_warning",
    warning_type: "source_refdes_convention_warning",
  })
  expect(warnings[0].source_refdes_convention_warning_id).toBeDefined()
})
