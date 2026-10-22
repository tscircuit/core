import { expect, test } from "bun:test"
import { getSchematicTextWidth } from "lib/utils/schematic/getSchematicTextWidth"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("default USB-C shell labels clear the right-side labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width={20} height={20}>
      <connector
        name="J1"
        standard="usb_c"
        pinLabels={{
          pin1: "SHELL2",
          pin2: "SHELL1",
          pin3: "SHELL4",
          pin4: "SHELL3",
          pin5: "SBU2",
          pin6: "CC1",
          pin7: "DM2",
          pin8: "DP1",
          pin9: "DM1",
          pin10: "DP2",
          pin11: "SBU1",
          pin12: "CC2",
          pin13: "GND1",
          pin14: "GND2",
          pin15: "VBUS1",
          pin16: "VBUS2",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicPorts = circuit.db.schematic_port.list()
  const shell4Port = schematicPorts.find(
    (port) => port.display_pin_label === "SHELL4",
  )!
  const schematicComponent = circuit.db.schematic_component.get(
    shell4Port.schematic_component_id!,
  )!
  const pinLabelFontSize = 0.15
  const pinLabelEdgePadding = 0.1
  const minimumLabelBankGap = 0.1
  const geometryTolerance = 1e-9
  // SBU2, GND1, and GND2 have the same width in core's conservative estimate.
  const rightLabelLeftEdge =
    schematicComponent.center.x +
    schematicComponent.size.width / 2 -
    pinLabelEdgePadding -
    getSchematicTextWidth({ text: "SBU2", fontSize: pinLabelFontSize })
  const shell4LabelRightEdge = shell4Port.center.x + pinLabelFontSize / 2

  expect(schematicPorts).toHaveLength(16)
  expect(schematicComponent.size.width).toBeCloseTo(1.7)
  expect(schematicComponent.size.height).toBeCloseTo(3.2)
  expect(rightLabelLeftEdge - shell4LabelRightEdge).toBeGreaterThanOrEqual(
    minimumLabelBankGap - geometryTolerance,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
