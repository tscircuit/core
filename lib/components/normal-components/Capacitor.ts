import { ledProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { FTYPE, SYMBOL } from "lib/utils/constants"

type PortNames =
  | "1"
  | "2"
  | "pin1"
  | "pin2"
  | "left"
  | "right"
  | "anode"
  | "cathode"

export class Capacitor extends PrimitiveComponent<typeof ledProps, PortNames> {
  get config() {
    return {
      // schematicSymbolName: BASE_SYMBOLS.capacitor,
      zodProps: ledProps,
      sourceFtype: FTYPE.simple_capacitor,
    }
  }
}
