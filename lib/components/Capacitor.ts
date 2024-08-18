import { ledProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"
import { FTYPE, BASE_SYMBOLS } from "lib/utils/constants"

export class Capacitor extends BaseComponent<typeof ledProps> {
  get config() {
    return {
      // schematicSymbolName: BASE_SYMBOLS.capacitor,
      zodProps: ledProps,
      sourceFtype: FTYPE.simple_capacitor,
    }
  }
}
