import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import React from "react"
import "lib/register-catalogue"

// Test that enabling showPinAliases shows all alias labels in the schematic

test("chip shows all pin aliases when showPinAliases is true", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* @ts-expect-error - showPinAliases is not yet typed */}
      <chip
        name="U1"
        schWidth={4}
        showPinAliases
        pinLabels={{
          pin1: ["GP0", "SPI1_SCK", "ADC1"],
          pin2: ["GP1"],
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["GP0", "GP1"],
          },
        }}
      />
    </board>,
  )

  circuit.render()

  const schematicPorts = circuit.db.schematic_port.list()
  const pin1Label = schematicPorts.find(
    (p) => p.pin_number === 1,
  )?.display_pin_label

  // Hints are collected from aliases followed by the primary name
  expect(pin1Label).toBe("SPI1_SCK/ADC1/GP0")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
