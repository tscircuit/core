import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getStandardUsbCPinLabels } from "../../../lib/utils/connectors/getStandardUsbCPinLabels"

const makeSourcePort = (pin: number, hints: string[]): AnyCircuitElement =>
  ({
    type: "source_port",
    source_port_id: `source_port_${pin}`,
    source_component_id: "source_component_0",
    subcircuit_id: "subcircuit_source_group_0",
    pin_number: pin,
    name: `pin${pin}`,
    port_hints: hints,
  }) as any

test("each standard USB-C pin label is matched to a pin_number in the circuit json", () => {
  // Mirrors the shape of the C165948 USB-C fixture.
  const circuitJson: AnyCircuitElement[] = [
    makeSourcePort(5, ["B8", "SBU2"]),
    makeSourcePort(6, ["A5", "CC1"]),
    makeSourcePort(7, ["B7", "DN2"]),
    makeSourcePort(8, ["A6", "DP1"]),
    makeSourcePort(9, ["A7", "DN1"]),
    makeSourcePort(10, ["B6", "DP2"]),
    makeSourcePort(11, ["A8", "SBU1"]),
    makeSourcePort(12, ["B5", "CC2"]),
    makeSourcePort(13, ["A1B12", "GND1"]),
    makeSourcePort(14, ["B1A12", "GND2"]),
    makeSourcePort(15, ["B4A9", "VBUS1"]),
    makeSourcePort(16, ["A4B9", "VBUS2"]),
    makeSourcePort(1, ["EH2"]),
    makeSourcePort(2, ["EH1"]),
    makeSourcePort(3, ["EH4"]),
    makeSourcePort(4, ["EH3"]),
  ]

  expect(getStandardUsbCPinLabels(circuitJson)).toEqual({
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
    pin2: "SHELL1",
    pin1: "SHELL2",
    pin4: "SHELL3",
    pin3: "SHELL4",
  })
})

test("each port is consumed by at most one standard pin label", () => {
  // Pin 1 claims both SBU1 and SBU2; the greedy match should give SBU1 to
  // pin 1 (first in canonical order) and leave SBU2 for pin 2.
  const circuitJson: AnyCircuitElement[] = [
    makeSourcePort(1, ["SBU1", "SBU2"]),
    makeSourcePort(2, ["SBU2"]),
  ]

  expect(getStandardUsbCPinLabels(circuitJson)).toEqual({
    pin1: "SBU1",
    pin2: "SBU2",
  })
})

test("standard pin labels with no matching port are omitted from the result", () => {
  const circuitJson: AnyCircuitElement[] = [
    makeSourcePort(1, ["CC1"]),
    makeSourcePort(2, ["GND1"]),
  ]

  expect(getStandardUsbCPinLabels(circuitJson)).toEqual({
    pin1: "CC1",
    pin2: "GND1",
  })
})
