import { expect, test } from "bun:test"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internal connection checks recognize transitive aliases, warn on [], and honor disabled DRC", async () => {
  const { partsEngine, importedCircuitJson, importedPorts } =
    getChipPinMetadataFixture([{}, {}, {}])
  const source = importedCircuitJson.find(
    (element) => element.type === "source_component",
  )!
  source.internally_connected_source_port_ids = [
    [
      importedPorts[0]!.source_port_id,
      importedPorts[1]!.source_port_id,
      importedPorts[2]!.source_port_id,
    ],
  ]
  for (const mode of [
    "matching",
    "empty",
    "disabled",
    "drc_disabled",
    "missing-data",
  ] as const) {
    const { circuit } = getTestFixture({
      platform:
        mode === "disabled"
          ? { pinSpecificationDrcChecksDisabled: true }
          : mode === "drc_disabled"
            ? { drcChecksDisabled: true }
            : undefined,
    })
    circuit.add(
      <board
        width={16}
        height={10}
        partsEngine={mode === "missing-data" ? undefined : partsEngine}
        routingDisabled
      >
        <chip
          name="U1"
          manufacturerPartNumber="SWITCH"
          footprint="pinrow3"
          pinLabels={{ pin1: "A", pin2: "B", pin3: "C" }}
          internallyConnectedPins={
            mode === "matching"
              ? [
                  [1, "B"],
                  ["pin2", "C"],
                ]
              : mode === "empty"
                ? []
                : undefined
          }
        />
        <pcbnotetext
          text={`Datasheet: A-B-C; prop: ${mode === "empty" ? "[] (warning)" : mode}`}
          pcbY={-3}
          fontSize={0.4}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const warnings = circuit.db.source_component_pins_underspecified_warning
      .list()
      .filter((warning) => warning.message.includes("internallyConnectedPins"))
    expect(warnings).toHaveLength(mode === "empty" ? 1 : 0)
    if (mode === "empty") {
      expect(warnings[0]!.message).toContain("does not declare that connection")
      expect(warnings[0]!.message).not.toContain("isn't set")
      expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
