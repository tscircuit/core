import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { sel } from "lib/sel"

interface MyChipProps extends ChipProps<"VIN" | "VOUT" | "GND" | "FB"> {
  pinLabels?: {
    pin1: "VIN"
    pin2: "VOUT"
    pin3: "GND"
    pin4: "FB"
  }
}
const MyChip = (props: MyChipProps) => null

test("sel supports arbitrary designators above 40 for all component prefixes (Issue #4913)", () => {
  // Chips above 40
  expect(sel.U501.VIN).toBe(".U501 > .VIN")
  expect(sel.U501.pin1).toBe(".U501 > .pin1")
  expect(sel.U999.VCC).toBe(".U999 > .VCC")
  expect(sel.U501(MyChip).VIN).toBe(".U501 > .VIN")
  expect(sel.U501(MyChip).VOUT).toBe(".U501 > .VOUT")

  // Resistors above 40
  expect(sel.R535.pin1).toBe(".R535 > .pin1")
  expect(sel.R535.pin2).toBe(".R535 > .pin2")

  // Capacitors above 40
  expect(sel.C403.pin1).toBe(".C403 > .pin1")
  expect(sel.C403.pos).toBe(".C403 > .pos")

  // Transistors above 40
  expect(sel.Q101.collector).toBe(".Q101 > .collector")
  expect(sel.Q101.base).toBe(".Q101 > .base")
  expect(sel.Q101.emitter).toBe(".Q101 > .emitter")

  // Diodes above 40
  expect(sel.D205.anode).toBe(".D205 > .anode")
  expect(sel.D205.cathode).toBe(".D205 > .cathode")

  // Switches above 40
  expect(sel.SW100.pin1).toBe(".SW100 > .pin1")

  // Jumpers & Connectors above 40
  expect(sel.J100.pin1).toBe(".J100 > .pin1")
  expect(sel.JP100.pin1).toBe(".JP100 > .pin1")
  expect(sel.CN100.pin1).toBe(".CN100 > .pin1")

  // TestPoints above 40
  expect(sel.TP100.pin1).toBe(".TP100 > .pin1")

  // GPIO nets above 40
  expect(sel.net.GPIO50).toBe("net.GPIO50")

  // Subcircuits above 40
  expect(sel.subcircuit.S101.U1.pin1).toBe("subcircuit.S101 > .U1 > .pin1")
})

test("sel invalid refdes still fails typecheck", () => {
  // @ts-expect-error - ASDF is not a valid refdes prefix
  const invalid = sel.ASDF500.pin1
})
