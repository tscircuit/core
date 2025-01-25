import { powerSourceProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"

export class PowerSource extends NormalComponent<
  typeof powerSourceProps,
  PolarizedPassivePorts
> {
  // @ts-ignore
  get config() {
    return {
      // TBD in schematic_symbol and replace then
      schematicSymbolName:
        this.props.symbolName ?? ("power_factor_meter_horz" as BaseSymbolName),
      componentName: "PowerSource",
      zodProps: powerSourceProps,
      sourceFtype: "simple_power_source" as Ftype,
    }
  }

  initPorts() {
    this.add(
      new Port({ name: "pin1", pinNumber: 1, aliases: ["positive", "pos"] }),
    )
    this.add(
      new Port({ name: "pin2", pinNumber: 2, aliases: ["negative", "neg"] }),
    )
  }

  pos = this.portMap.pin1
  positive = this.portMap.pin1
  neg = this.portMap.pin2
  negative = this.portMap.pin2
}
