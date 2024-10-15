import { diodeProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"

export class Diode extends NormalComponent<
  typeof diodeProps,
  PolarizedPassivePorts
> {
  // @ts-ignore
  get config() {
    return {
      schematicSymbolName:
        this.props.symbolName ?? ("diode_horz" as BaseSymbolName),
      componentName: "Diode",
      zodProps: diodeProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  initPorts() {
    this.add(
      new Port({ name: "pin1", pinNumber: 1, aliases: ["anode", "pos", "left"] }),
    )
    this.add(
      new Port({ name: "pin2", pinNumber: 2, aliases: ["cathode", "neg", "right"] }),
    )
  }

  pos = this.portMap.pin1
  anode = this.portMap.pin1
  neg = this.portMap.pin2
  cathode = this.portMap.pin2
}
