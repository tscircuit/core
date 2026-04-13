import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToUsbCStandardCircuitJson } from "../../../lib/utils/connectors/convertCircuitJsonToUsbCStandardCircuitJson"

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

const getSourcePortByPin = (
  circuitJson: AnyCircuitElement[],
  pinNumber: number,
): AnyCircuitElement | undefined =>
  circuitJson.find(
    (elm) =>
      elm.type === "source_port" && (elm as any).pin_number === pinNumber,
  )

test("converts part circuit json to USB-C-standardized circuit json", () => {
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
    {
      type: "pcb_smtpad",
      shape: "rect",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
      port_hints: ["pin7"],
    } as any,
  ]

  const rewritten = convertCircuitJsonToUsbCStandardCircuitJson(circuitJson)

  expect((getSourcePortByPin(rewritten, 7) as any)?.port_hints).toContain("DM2")
  expect((getSourcePortByPin(rewritten, 9) as any)?.port_hints).toContain("DM1")
  expect((getSourcePortByPin(rewritten, 13) as any)?.port_hints).toContain(
    "GND1",
  )
  expect((getSourcePortByPin(rewritten, 15) as any)?.port_hints).toContain(
    "VBUS1",
  )
  expect((getSourcePortByPin(rewritten, 2) as any)?.port_hints).toContain(
    "SHELL1",
  )

  const pad = rewritten.find((elm: any) => elm.type === "pcb_smtpad") as any
  expect(pad.port_hints).toContain("DM2")
})

test("each source_port is consumed by at most one canonical label", () => {
  // Pin 1 claims both DN1 and DN2; the greedy match should give DM1 to pin 1
  // (first in canonical order) and leave DM2 for pin 2.
  const circuitJson: AnyCircuitElement[] = [
    makeSourcePort(1, ["DN1", "DN2"]),
    makeSourcePort(2, ["DN2"]),
  ]

  const rewritten = convertCircuitJsonToUsbCStandardCircuitJson(circuitJson)

  expect((getSourcePortByPin(rewritten, 1) as any)?.port_hints).toContain("DM1")
  expect((getSourcePortByPin(rewritten, 2) as any)?.port_hints).toContain("DM2")
})

test("canonical labels with no matching source_port are omitted", () => {
  const circuitJson: AnyCircuitElement[] = [
    makeSourcePort(1, ["CC1"]),
    makeSourcePort(2, ["GND1"]),
  ]

  const rewritten = convertCircuitJsonToUsbCStandardCircuitJson(circuitJson)

  expect((getSourcePortByPin(rewritten, 1) as any)?.port_hints).toContain("CC1")
  expect((getSourcePortByPin(rewritten, 2) as any)?.port_hints).toContain(
    "GND1",
  )
  expect((getSourcePortByPin(rewritten, 1) as any)?.port_hints).not.toContain(
    "VBUS1",
  )
})
