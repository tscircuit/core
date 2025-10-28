import { Group } from "../Group"
import { subcircuitProps } from "@tscircuit/props"
import { cju } from "@tscircuit/circuit-json-util"
import type { z } from "zod"
import { inflateSourceResistor } from "./inflators/inflateSourceResistor"

export class Subcircuit extends Group<typeof subcircuitProps> {
  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  /**
   * During this phase, we inflate the subcircuit circuit json into class
   * instances
   *
   * When subcircuit's define circuitJson, it's basically the same as having
   * a tree of components. All the data from circuit json has to be converted
   * into props for the tree of components
   *
   * We do this in two phases:
   * - Create the components
   * - Create the groups
   * - Add components to groups in the appropriate hierarchy
   */
  doInitialInflateSubcircuitCircuitJson() {
    const { circuitJson, children } = this._parsedProps
    if (!circuitJson) return
    const { db } = this.root!

    if (circuitJson && children?.length > 0) {
      throw new Error("Subcircuit cannot have both circuitJson and children")
    }

    const sourceComponents = cju(circuitJson).source_component.list()
    for (const sourceComponent of sourceComponents) {
      switch (sourceComponent.ftype) {
        case "simple_resistor":
          inflateSourceResistor(sourceComponent, {
            injectionDb: db,
            subcircuit: this,
          })
          break
        default:
          throw new Error(
            `No inflator implemented for source component ftype: "${sourceComponent.ftype}"`,
          )
      }
    }
  }
}
