import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { DatasheetPartCircuitJsonRequest } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import externalFootprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repeated supplier chips share a datasheet fallback without losing per-chip warnings", async () => {
  const includeOptions: (boolean | undefined)[] = []
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async ({
      includeDatasheetInformation,
    }: DatasheetPartCircuitJsonRequest) => {
      includeOptions.push(includeDatasheetInformation)
      if (includeDatasheetInformation) throw new Error("Datasheet timeout")
      return externalFootprint as AnyCircuitElement[]
    },
  }
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group subcircuit partsEngine={partsEngine}>
      <chip
        name="U1"
        manufacturerPartNumber="TEST_CHIP"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
      />
      <chip
        name="U2"
        manufacturerPartNumber="TEST_CHIP"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinAttributes={{ pin1: { requiresVoltage: "1.8V" } }}
      />
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(includeOptions).toEqual([true, false])
  const warnings = circuit.db.source_property_ignored_warning
    .list()
    .filter((warning) => warning.property_name === "pinAttributes")
  expect(warnings).toHaveLength(2)
  for (const warning of warnings) {
    const chipName = circuit.db.source_component.get(
      warning.source_component_id,
    )!.name
    expect(warning.message).toContain(`chip "${chipName}"`)
    expect(warning.message).toContain("Datasheet timeout")
  }
})
