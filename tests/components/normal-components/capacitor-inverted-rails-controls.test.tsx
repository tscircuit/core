import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("skips correct, horizontal and unknown rails and honors disabled checks", async () => {
  for (const options of [
    { rotation: 270, supply: "V3V3" },
    { rotation: 0, supply: "V3V3" },
    { rotation: 90, supply: "SIGNAL" },
    { rotation: 90, supply: "V3V3", platformDrcDisabled: true },
    { rotation: 90, supply: "V3V3", schematicDisabled: true },
  ]) {
    const { circuit } = getTestFixture({
      platform: { drcChecksDisabled: options.platformDrcDisabled },
    })
    circuit.pcbDisabled = true
    circuit.add(
      <board
        schTraceAutoLabelEnabled
        schematicDisabled={options.schematicDisabled}
      >
        <schematicsheet
          name="Power"
          displayName="Power"
          sheetIndex={0}
          sheetWidth="60mm"
          sheetHeight="40mm"
        >
          <capacitor
            name="C1"
            capacitance="100nF"
            schRotation={options.rotation}
          />
          <trace from=".C1 > .pin1" to={`net.${options.supply}`} />
          <trace from=".C1 > .pin2" to="net.GND" />
        </schematicsheet>
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.schematic_component_styling_warning
        .list()
        .filter((warning) => warning.styling_issue_type === "inverted_rails"),
    ).toEqual([])
    if (options.rotation === 270)
      expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  }
})
