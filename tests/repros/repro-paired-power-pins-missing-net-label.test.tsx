import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Example = () => (
  <board>
    <schematicsheet name="Power">
      <schematicsection name="PowerManagement" />
    </schematicsheet>
    <net name="PMID" />
    <net name="VBAT" />
    <chip
      name="U1"
      schX={5}
      schY={-11}
      schSheetName="Power"
      schSectionName="PowerManagement"
      pinLabels={{
        pin3: "PMID1",
        pin6: "BAT1",
        pin7: "BAT2",
        pin8: "PMID2",
        pin9: "VINLS1",
        pin14: "VINLS2",
      }}
      schPinArrangement={{
        leftSide: [3, 6, 7, 8, 9],
        rightSide: [14],
      }}
    />
    <capacitor
      name="C4"
      capacitance="10uF"
      schX={1}
      schY={-8.5}
      schRotation={-90}
      schSheetName="Power"
      schSectionName="PowerManagement"
    />
    <capacitor
      name="C17"
      capacitance="10uF"
      schX={9}
      schY={-8.5}
      schRotation={90}
      schSheetName="Power"
      schSectionName="PowerManagement"
    />
    <trace from=".U1 > .pin3" to="net.PMID" schDisplayLabel="PMID" />
    <trace from=".U1 > .pin8" to="net.PMID" schDisplayLabel="PMID" />
    <trace from=".U1 > .pin9" to="net.PMID" schDisplayLabel="PMID" />
    <trace from=".U1 > .pin14" to="net.PMID" schDisplayLabel="PMID" />
    <trace from=".C4 > .pin1" to="net.PMID" schDisplayLabel="PMID" />
    <trace from=".U1 > .pin6" to="net.VBAT" schDisplayLabel="VBAT" />
    <trace from=".U1 > .pin7" to="net.VBAT" schDisplayLabel="VBAT" />
    <trace from=".C17 > .pin2" to="net.VBAT" schDisplayLabel="VBAT" />
  </board>
)

export default Example

test("paired VBAT pins are wired together but lose their named-net label", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<Example />)
  await circuit.renderUntilSettled()

  // Records the current output: BAT1/BAT2 form an unlabeled island,
  // although their source traces and C17.2 all connect to net.VBAT.
  // Omit the page frame so the missing label is visible at component scale.
  expect(
    circuit.getCircuitJson().filter((row) => row.type !== "schematic_sheet"),
  ).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})
