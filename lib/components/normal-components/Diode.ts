import { diodeProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"
import { Port } from "../primitive-components/Port"

type Direction = 'right' | 'left' | 'up' | 'down';

export class Diode extends NormalComponent<
  typeof diodeProps,
  PolarizedPassivePorts
> {
  get config() {
    const direction = (this.props.direction ?? "right") as Direction
    const symbolMap: Record<Direction, BaseSymbolName> = {
      right: "diode",
      left: "diode_left",
      up: "diode_up",
      down: "diode_down"
    }

    return {
      schematicSymbolName: this.props.symbolName ?? symbolMap[direction],
      componentName: "Diode",
      zodProps: diodeProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  initPorts() {
    const direction = (this.props.direction ?? "right") as Direction
    const portAliases: Record<Direction, Record<string, string[]>> = {
      right: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
      left: {
        pin1: ["anode", "pos", "right"],
        pin2: ["cathode", "neg", "left"],
      },
      up: {
        pin1: ["anode", "pos", "bottom"],
        pin2: ["cathode", "neg", "top"],
      },
      down: {
        pin1: ["anode", "pos", "top"],
        pin2: ["cathode", "neg", "bottom"],
      },
    }

    super.initPorts({
      additionalAliases: portAliases[direction],
    })
  }

  pos = this.portMap.pin1
  anode = this.portMap.pin1
  neg = this.portMap.pin2
  cathode = this.portMap.pin2
}