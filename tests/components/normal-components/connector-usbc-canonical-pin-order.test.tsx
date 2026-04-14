import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import usbCC2765186CircuitJson from "tests/fixtures/assets/usb-c-C2765186.circuit.json"

/**
 * Different USB-C connector parts (C165948 vs C2765186) have different
 * manufacturer pin numberings. Both should produce the same canonical
 * schematic pin side ordering.
 */
test("USB-C connectors from different manufacturers produce same schematic pin layout", async () => {
  const { circuit: circuit1 } = getTestFixture()
  const { circuit: circuit2 } = getTestFixture()

  const makePartsEngine = (
    circuitJson: AnyCircuitElement[],
    partNumber: string,
  ): PartsEngine => ({
    findPart: async () => ({ jlcpcb: [partNumber] }),
    fetchPartCircuitJson: async ({ supplierPartNumber }) => {
      if (supplierPartNumber === partNumber) return circuitJson
      return undefined
    },
  })

  circuit1.add(
    <board
      partsEngine={makePartsEngine(
        usbCC165948CircuitJson as AnyCircuitElement[],
        "C165948",
      )}
      width="20mm"
      height="20mm"
    >
      <connector name="USB1" standard="usb_c" />
    </board>,
  )

  circuit2.add(
    <board
      partsEngine={makePartsEngine(
        usbCC2765186CircuitJson as AnyCircuitElement[],
        "C2765186",
      )}
      width="20mm"
      height="20mm"
    >
      <connector name="USB1" standard="usb_c" />
    </board>,
  )

  await circuit1.renderUntilSettled()
  await circuit2.renderUntilSettled()

  const getOrderedLabelsForSide = (
    circuit: typeof circuit1,
    side: "right" | "bottom",
  ) => {
    const schPorts = circuit.db.schematic_port.list()
    const labels = schPorts
      .filter(
        (p) =>
          p.side_of_component === side &&
          typeof p.display_pin_label === "string" &&
          p.display_pin_label.length > 0,
      )
      .sort((a, b) =>
        side === "right" ? b.center.y - a.center.y : a.center.x - b.center.x,
      )
      .map((p) => p.display_pin_label!.toUpperCase())

    return labels
  }

  const rightSideLabels1 = getOrderedLabelsForSide(circuit1, "right")
  const rightSideLabels2 = getOrderedLabelsForSide(circuit2, "right")
  const bottomSideLabels1 = getOrderedLabelsForSide(circuit1, "bottom")
  const bottomSideLabels2 = getOrderedLabelsForSide(circuit2, "bottom")

  const expectedRightSideLabels = [
    "VBUS1",
    "VBUS2",
    "CC1",
    "CC2",
    "DP1",
    "DP2",
    "DM1",
    "DM2",
    "SBU1",
    "SBU2",
    "GND1",
    "GND2",
  ]
  const expectedBottomSideLabels = ["SHELL1", "SHELL2", "SHELL3", "SHELL4"]

  expect(rightSideLabels1).toEqual(expectedRightSideLabels)
  expect(rightSideLabels2).toEqual(expectedRightSideLabels)
  expect(bottomSideLabels1).toEqual(expectedBottomSideLabels)
  expect(bottomSideLabels2).toEqual(expectedBottomSideLabels)
  expect(bottomSideLabels1).toEqual(bottomSideLabels2)
})
