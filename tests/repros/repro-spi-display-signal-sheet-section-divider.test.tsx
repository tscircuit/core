import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import signalSheetCircuitJson from "./assets/spi-display-signal-sheet.circuit.json"

test("spi display signal sheet sections with a narrow gap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="SIGNALS"
        displayName="1. Display Capture, Memory & USB"
      >
        <schematicsection name="CAPTURE_MEMORY" />
        <schematicsection name="USB" />
      </schematicsheet>
      <chip
        name="CAPTURE_MEMORY_BOUNDS"
        schSheetName="SIGNALS"
        schSectionName="CAPTURE_MEMORY"
        schX={-6.365}
        schY={-1}
        schWidth={14.23}
        schHeight={15}
      />
      <chip
        name="USB_BOUNDS"
        schSheetName="SIGNALS"
        schSectionName="USB"
        schX={6.74125}
        schY={0.867227675}
        schWidth={11.4575}
        schHeight={14.98445535}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sectionDividers = circuit.db.schematic_line.list()
  expect(sectionDividers).toHaveLength(0)

  const schematicWithoutManualDivider = (
    signalSheetCircuitJson as AnyCircuitElement[]
  ).filter((element) => element.type !== "schematic_line")

  expect(schematicWithoutManualDivider).toMatchSchematicSnapshot(
    import.meta.path,
  )
})
