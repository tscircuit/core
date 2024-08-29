import { ledProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { FTYPE, SYMBOL } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"

type PortNames =
  | "1"
  | "2"
  | "pin1"
  | "pin2"
  | "left"
  | "right"
  | "anode"
  | "cathode"

export class Capacitor extends NormalComponent<typeof ledProps, PortNames> {
  get config() {
    return {
      // schematicSymbolName: BASE_SYMBOLS.capacitor,
      zodProps: ledProps,
      sourceFtype: FTYPE.simple_capacitor,
    }
  }
}
