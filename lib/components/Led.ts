import { ledProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"
import { FTYPE, BASE_SYMBOLS } from "lib/utils/constants"

export class Led extends BaseComponent<typeof ledProps> {
  get config() {
    return {
      schematicSymbolName: BASE_SYMBOLS.led,
      zodProps: ledProps,
      sourceFtype: FTYPE.simple_diode,
    }
  }
}
