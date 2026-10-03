import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("datasheet timeout preserves the supplier footprint and emits one pin attribute warning", async () => {
  const { circuit } = getTestFixture()
  const includeOptions: (boolean | undefined)[] = []
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async ({
      includeDatasheetInformation,
    }: { includeDatasheetInformation?: boolean }) => {
      includeOptions.push(includeDatasheetInformation)
      if (includeDatasheetInformation)
        throw new Error("Datasheet API did not respond within 5 seconds")
      return external0402Footprint as AnyCircuitElement[]
    },
  }
  circuit.add(
    <board width="20mm" height="10mm" partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="EXAMPLE"
        supplierPartNumbers={{ jlcpcb: ["C_EXAMPLE"] }}
        footprint="jlcpcb:C_EXAMPLE"
        pinAttributes={{ pin1: { requiresVoltage: 2.8 } }}
      />
      <pcbnotetext
        pcbY={-3}
        text="5s datasheet timeout: footprint preserved"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(includeOptions).toEqual([true, false])
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(
    circuit.db.source_port.list().find((port) => port.pin_number === 1),
  ).toMatchObject({ requires_voltage: 2.8 })
  const warnings = circuit.db.source_property_ignored_warning
    .list()
    .filter((warning) => warning.property_name === "pinAttributes")
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toContain("did not respond within 5 seconds")
  expect(warnings[0].message).toContain("Pin attributes may not be populated")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
