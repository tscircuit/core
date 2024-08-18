import { diodeProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"
import { FTYPE, BASE_SYMBOLS } from "lib/utils/constants"

export class Diode extends BaseComponent<typeof diodeProps> {
  get config() {
    return {
      // schematicSymbolName: BASE_SYMBOLS.diode,
      zodProps: diodeProps,
      sourceFtype: FTYPE.simple_diode,
    }
  }
}
