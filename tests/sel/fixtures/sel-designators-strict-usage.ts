import type { ChipProps } from "@tscircuit/props"
import { sel } from "lib/sel"

// Typechecked with `noUncheckedIndexedAccess` by
// sel-designators-no-unchecked-indexed-access.test.ts. Designators 0..40 must
// keep their exact type instead of becoming possibly `undefined`.

const regulatorPinLabels = {
  pin1: "VIN",
  pin2: "GND",
  pin3: "VOUT",
} as const

const Regulator = (props: ChipProps<typeof regulatorPinLabels>) => null

export const regulatorVinSelector: string = sel.U6(Regulator).VIN
export const chipGndSelector: string = sel.U1.GND
export const usbcGndSelector: string = sel.USBC.GND
export const resistorPosSelector: string = sel.R40.pos
export const subcircuitPinSelector: string = sel.subcircuit.S1.U1.pin1
