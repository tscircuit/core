import { ledProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"
import { FTYPE, BASE_SYMBOLS } from "lib/utils/constants"

type PortNames =
  | "1"
  | "2"
  | "pin1"
  | "pin2"
  | "left"
  | "right"
  | "anode"
  | "cathode"

export class Capacitor extends BaseComponent<typeof ledProps, PortNames> {
  get config() {
    return {
      // schematicSymbolName: BASE_SYMBOLS.capacitor,
      zodProps: ledProps,
      sourceFtype: FTYPE.simple_capacitor,
    }
  }
}
