import { ledProps } from "@tscircuit/props"
import type {
  BaseSymbolName,
  Ftype,
  PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"

export class Led extends NormalComponent<
  typeof ledProps,
  PolarizedPassivePorts
> {
  // @ts-ignore
  get config() {
    return {
      componentName: "Led",
      schematicSymbolName: this.props.symbolName ?? "led_horz" as BaseSymbolName,
      zodProps: ledProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  initPorts() {
    this.add(new Port({ name: "pin1", pinNumber: 1, aliases: ["anode", "pos"] }))
    this.add(new Port({ name: "pin2", pinNumber: 2, aliases: ["cathode", "neg"] }))
  }

  pos = this.portMap.pin1
  anode = this.portMap.pin1
  neg = this.portMap.pin2
  cathode = this.portMap.pin2
}
