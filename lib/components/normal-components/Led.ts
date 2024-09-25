import { ledProps } from "@tscircuit/props"
import type {
  BaseSymbolName,
  Ftype,
  PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"

export class Led extends NormalComponent<
  typeof ledProps,
  PolarizedPassivePorts
> {
  get config() {
    return {
      componentName: "Led",
      schematicSymbolName: "led" as BaseSymbolName,
      zodProps: ledProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  pos = this.portMap.pin1
  pin1 = this.portMap.pin1
  anode = this.portMap.pin1
  neg = this.portMap.pin2
  pin2 = this.portMap.pin2
  cathode = this.portMap.pin2
}
