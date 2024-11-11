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
      schematicSymbolName: this.props.symbolName ?? ("led" as BaseSymbolName),
      zodProps: ledProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
    })
  }

  pos = this.portMap.pin1
  anode = this.portMap.pin1
  neg = this.portMap.pin2
  cathode = this.portMap.pin2
}
