import { antennaProps } from "@tscircuit/props"
import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import { FTYPE } from "lib/utils/constants"

export class Antenna extends NormalComponent<
  typeof antennaProps,
  "pin1" | "feed"
> {
  get config() {
    return {
      componentName: "Antenna",
      zodProps: antennaProps,
      sourceFtype: FTYPE.simple_chip,
      shouldRenderAsSchematicBox: true,
    }
  }

  getRefDesPrefixes(): string[] {
    return ["ANT"]
  }

  initPorts(): void {
    super.initPorts({
      pinCount: 1,
      additionalAliases: { pin1: ["feed"] },
    })
  }

  doInitialCreateTracesFromProps(): void {
    super.doInitialCreateTracesFromProps()

    const { pcbPath } = this._parsedProps
    if (!pcbPath) return

    this.add(
      new Trace({
        name: `${this.name}_pcb_path`,
        path: [`${this.getSubcircuitSelector()} > port.pin1`],
        pcbPath,
      }),
    )
  }
}
