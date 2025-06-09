import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import React from "react"
import "lib/register-catalogue"

// Verify that the schematic port labels include all pin aliases when showPinAliases is true

test("chip showPinAliases renders all aliases", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        showPinAliases
        pinLabels={{
          pin1: ["GP0", "SPI1_SCK", "ADC1"],
          pin8: "GND",
        }}
        schPinArrangement={{ leftSize: 4, rightSize: 4 }}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip")!
  const schComponent = circuit.db.schematic_component.get(
    chip.schematic_component_id!,
  )!

  const label = schComponent.port_labels?.pin1
  expect(label).toBeTruthy()
  const parts = label!.split("/").sort()
  expect(parts).toEqual(["ADC1", "GP0", "SPI1_SCK"].sort())

  expect(
    convertCircuitJsonToSchematicSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
