import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("source_refdes_convention_warning is emitted when a chip uses a refdes reserved for another component type", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip name="J1" />
      <chip name="Q1" />
      <chip name="C1" />
      <chip name="R1" />
      <chip name="L1" />
      <chip name="Y1" />
      <chip name="X1" />
      <chip name="F1" />
      <chip name="S1" />
      <chip name="TP1" />
      <chip name="U1" />
      <jumper name="J2" />
      <connector name="J3" />
    </board>,
  )

  circuit.render()

  const warnings = (circuit.db as any).source_refdes_convention_warning.list()

  expect(warnings).toHaveLength(10)
  expect(warnings.map((warning: any) => warning.refdes).sort()).toEqual(
    ["J1", "Q1", "C1", "R1", "L1", "Y1", "X1", "F1", "S1", "TP1"].sort(),
  )
  const expectedMessagesByRefDes: Record<string, string> = {
    J1: 'The "J" prefix is being used with a <chip />, try using it with a <connector /> or <jumper />',
    Q1: 'The "Q" prefix is being used with a <chip />, try using it with a <transistor />',
    C1: 'The "C" prefix is being used with a <chip />, try using it with a <capacitor />',
    R1: 'The "R" prefix is being used with a <chip />, try using it with a <resistor />',
    L1: 'The "L" prefix is being used with a <chip />, try using it with an <inductor />',
    Y1: 'The "Y" prefix is being used with a <chip />, try using it with a <crystal />',
    X1: 'The "X" prefix is being used with a <chip />, try using it with a <crystal />',
    F1: 'The "F" prefix is being used with a <chip />, try using it with a <fuse />',
    S1: 'The "S" prefix is being used with a <chip />, try using it with a <switch /> or <pushbutton />',
    TP1: 'The "TP" prefix is being used with a <chip />, try using it with a <testpoint />',
  }
  expect(warnings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ actual_prefix: "J" }),
      expect.objectContaining({ actual_prefix: "Q" }),
      expect.objectContaining({ actual_prefix: "C" }),
      expect.objectContaining({ actual_prefix: "R" }),
      expect.objectContaining({ actual_prefix: "L" }),
      expect.objectContaining({ actual_prefix: "Y" }),
      expect.objectContaining({ actual_prefix: "X" }),
      expect.objectContaining({ actual_prefix: "F" }),
      expect.objectContaining({ actual_prefix: "S" }),
      expect.objectContaining({ actual_prefix: "TP" }),
    ]),
  )
  for (const warning of warnings) {
    expect(warning).toMatchObject({
      type: "source_refdes_convention_warning",
      warning_type: "source_refdes_convention_warning",
      source_component_ftype: "simple_chip",
      expected_prefixes: ["U", "IC"],
      message: expectedMessagesByRefDes[warning.refdes],
    })
  }
})
