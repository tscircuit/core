import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ESP32_S3_WROOM_1_N16 } from "./esp32-s3-wroom-1-n16-import"

test("full C2913199 custom symbol and split ground pads", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={36} routingDisabled>
      <ESP32_S3_WROOM_1_N16 name="U1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(1)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(49)
  expect(circuit.db.pcb_port.list()).toHaveLength(40)
  expect(circuit.db.schematic_port.list()).toHaveLength(41)
  expect(circuit.db.source_port.list()).toHaveLength(41)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showPinNumbers: true,
    showErrorsInTextOverlay: true,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    shouldDrawErrors: true,
    showErrorsInTextOverlay: true,
    labeledPoints: [
      {
        x: -1.5,
        y: 2.9,
        label: `Ambiguous references: ${circuit.db.source_ambiguous_port_reference.list().length}`,
      },
    ],
    grid: { cellSize: 1, labelCells: true },
  })
})
