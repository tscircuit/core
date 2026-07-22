import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USB-C connector renders canonical ports when the Parts Engine fetch fails", async () => {
  const { circuit } = getTestFixture()

  const partsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C165948"] }),
    fetchPartCircuitJson: async () => {
      throw new Error("Parts Engine fetch failed")
    },
  }

  circuit.add(
    <board partsEngine={partsEngine} width="30mm" height="20mm">
      <connector name="J_USB" standard="usb_c" />
      <schematictext
        text="Repro: failed Parts Engine fetch uses canonical USB-C ports"
        schX={0}
        schY={-2.5}
        fontSize={0.2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit.db.source_part_not_found_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toContain("Parts Engine fetch failed")

  const expectedCanonicalLabels = [
    "GND1",
    "VBUS1",
    "CC1",
    "DP1",
    "DM1",
    "SBU1",
    "SBU2",
    "DM2",
    "DP2",
    "CC2",
    "VBUS2",
    "GND2",
    "SHELL1",
    "SHELL2",
    "SHELL3",
    "SHELL4",
  ].sort()
  const sourcePortLabels = circuit.db.source_port
    .list()
    .map((port) => port.name)
    .sort()
  const schematicPortLabels = circuit.db.schematic_port
    .list()
    .map((port) => port.display_pin_label)
    .sort()

  expect(sourcePortLabels).toEqual(expectedCanonicalLabels)
  expect(schematicPortLabels).toEqual(expectedCanonicalLabels)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
