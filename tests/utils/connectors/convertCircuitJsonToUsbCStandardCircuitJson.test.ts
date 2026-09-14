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

  // Keep original pin hints while appending canonical USB-C label.
  const pad = rewritten.find((elm: any) => elm.type === "pcb_smtpad") as any
  expect(pad.port_hints).toContain("DM2")
  expect(pad.port_hints).toContain("pin7")
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

test("shell pads sharing a pin number get distinct SHELL labels", () => {
  // Two plated holes claim pin 13 and two claim pin 14. Each hole must end up
  // with its own SHELL label on its own pin so no label lands on two pads.
  const makePlatedHole = (
    id: string,
    pinHint: string,
    x: number,
  ): AnyCircuitElement =>
    ({
      type: "pcb_plated_hole",
      shape: "circle",
      pcb_plated_hole_id: id,
      x,
      y: 0,
      hole_diameter: 0.7,
      outer_diameter: 1.1,
      layers: ["top", "bottom"],
      port_hints: [pinHint],
    }) as any

  const circuitJson: AnyCircuitElement[] = [
    makeSourcePort(13, ["EH1"]),
    makeSourcePort(14, ["EH2"]),
    makePlatedHole("ph_a", "pin13", -4),
    makePlatedHole("ph_b", "pin13", -4),
    makePlatedHole("ph_c", "pin14", 4),
    makePlatedHole("ph_d", "pin14", 4),
  ]

  const rewritten = convertCircuitJsonToUsbCStandardCircuitJson(circuitJson)

  const holeHints = rewritten
    .filter((elm: any) => elm.type === "pcb_plated_hole")
    .map((elm: any) => elm.port_hints as string[])

  const shellLabels = holeHints.map(
    (hints) => hints.find((h) => /^SHELL\d+$/.test(h))!,
  )
  expect(shellLabels).toHaveLength(4)
  expect(new Set(shellLabels).size).toBe(4)

  // Each hole keeps exactly one pin-number hint, and all four are distinct so
  // every hole becomes its own port.
  const pinHints = holeHints.map(
    (hints) => hints.find((h) => /^pin\d+$/.test(h))!,
  )
  expect(new Set(pinHints).size).toBe(4)
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
