import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { rewriteToStandardUsbCPortHints } from "../../../lib/utils/connectors/rewriteToStandardUsbCPortHints"

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

const makePad = (pin: number): AnyCircuitElement =>
  ({
    type: "pcb_smtpad",
    pcb_smtpad_id: `pcb_smtpad_${pin}`,
    shape: "rect",
    x: pin,
    y: 0,
    width: 1,
    height: 1,
    layer: "top",
    port_hints: [`pin${pin}`],
    pcb_component_id: "pcb_component_0",
  }) as any

test("rewriteToStandardUsbCPortHints adds every USB-C standard hint to the corresponding pin hints", () => {
  const standardHints = [
    "GND1",
    "VBUS1",
    "SBU2",
    "CC1",
    "DM2",
    "DP1",
    "DM1",
    "DP2",
    "SBU1",
    "CC2",
    "VBUS2",
    "GND2",
    "SHELL1",
    "SHELL2",
    "SHELL3",
    "SHELL4",
  ]

  const input: AnyCircuitElement[] = []
  for (let i = 0; i < standardHints.length; i++) {
    const pin = i + 1
    input.push(makeSourcePort(pin, [standardHints[i]]))
    input.push(makePad(pin))
  }

  const rewritten = rewriteToStandardUsbCPortHints(input)

  for (let i = 0; i < standardHints.length; i++) {
    const pin = i + 1
    const expectedHint = standardHints[i]
    const pad = rewritten.find(
      (e: any) =>
        e.type === "pcb_smtpad" &&
        Array.isArray(e.port_hints) &&
        e.port_hints.includes(`pin${pin}`),
    ) as any
    expect(pad).toBeTruthy()
    expect(pad.port_hints).toContain(expectedHint)
  }
})

test("rewriteToStandardUsbCPortHints adds DN/DM aliases and preserves non-standard source aliases", () => {
  const input: AnyCircuitElement[] = [
    makeSourcePort(7, ["DN1"]),
    makeSourcePort(8, ["DM2"]),
    makeSourcePort(2, ["EH1"]),
    makePad(7),
    makePad(8),
    makePad(2),
  ]

  const rewritten = rewriteToStandardUsbCPortHints(input)

  const pin7Pad = rewritten.find(
    (e: any) => e.type === "pcb_smtpad" && e.port_hints?.includes("pin7"),
  ) as any
  const pin8Pad = rewritten.find(
    (e: any) => e.type === "pcb_smtpad" && e.port_hints?.includes("pin8"),
  ) as any
  const pin2Pad = rewritten.find(
    (e: any) => e.type === "pcb_smtpad" && e.port_hints?.includes("pin2"),
  ) as any

  expect(pin7Pad.port_hints).toContain("DN1")
  expect(pin7Pad.port_hints).toContain("DM1")
  expect(pin8Pad.port_hints).toContain("DM2")
  expect(pin8Pad.port_hints).toContain("DN2")

  expect(pin2Pad.port_hints).toContain("EH1")
  expect(pin2Pad.port_hints).not.toContain("SHELL1")
})

test("rewriteToStandardUsbCPortHints does not change source_port pin_number or name", () => {
  const input: AnyCircuitElement[] = [
    makeSourcePort(13, ["A1B12", "GND1"]),
    makeSourcePort(15, ["B4A9", "VBUS1"]),
    makePad(13),
    makePad(15),
  ]

  const rewritten = rewriteToStandardUsbCPortHints(input)

  const sourcePortsBefore = input.filter(
    (e: any) => e.type === "source_port",
  ) as any[]
  const sourcePortsAfter = rewritten.filter(
    (e: any) => e.type === "source_port",
  ) as any[]

  expect(sourcePortsAfter.length).toBe(sourcePortsBefore.length)
  for (const before of sourcePortsBefore) {
    const after = sourcePortsAfter.find(
      (sp) => sp.source_port_id === before.source_port_id,
    )
    expect(after).toBeTruthy()
    expect(after.pin_number).toBe(before.pin_number)
    expect(after.name).toBe(before.name)
  }
})
