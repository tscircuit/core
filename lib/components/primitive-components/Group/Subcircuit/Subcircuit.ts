import { Group } from "../Group"
import { subcircuitProps } from "@tscircuit/props"
import { cju } from "@tscircuit/circuit-json-util"
import type { z } from "zod"
import { inflateSourceResistor } from "./inflators/inflateSourceResistor"
import { inflateSourcePort } from "./inflators/inflateSourcePort"
import { inflateSourceGroup } from "./inflators/inflateSourceGroup"
import type { InflatorContext, SourceGroupId } from "./InflatorFn"
import { inflateSourceChip } from "./inflators/inflateSourceChip"
import { inflateSourceCapacitor } from "./inflators/inflateSourceCapacitor"
import { inflateSourceInductor } from "./inflators/inflateSourceInductor"

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
    const { circuitJson: injectionCircuitJson, children } = this._parsedProps
    if (!injectionCircuitJson) return
    const injectionDb = cju(injectionCircuitJson)

    if (injectionCircuitJson && children?.length > 0) {
      throw new Error("Subcircuit cannot have both circuitJson and children")
    }

    // Create a map to store inflated groups
    const groupsMap = new Map<SourceGroupId, Group<any>>()

    const inflationCtx: InflatorContext = {
      injectionDb,
      subcircuit: this,
      groupsMap,
    }

    // First, inflate all groups to preserve hierarchy
    const sourceGroups = injectionDb.source_group.list()
    for (const sourceGroup of sourceGroups) {
      inflateSourceGroup(sourceGroup, inflationCtx)
    }

    // Then inflate components, adding them to their groups
    const sourceComponents = injectionDb.source_component.list()
    for (const sourceComponent of sourceComponents) {
      switch (sourceComponent.ftype) {
        case "simple_resistor":
          inflateSourceResistor(sourceComponent, inflationCtx)
          break
        case "simple_capacitor":
          inflateSourceCapacitor(sourceComponent, inflationCtx)
          break
        case "simple_inductor":
          inflateSourceInductor(sourceComponent, inflationCtx)
          break
        case "simple_chip":
          inflateSourceChip(sourceComponent, inflationCtx)
          break
        default:
          throw new Error(
            `No inflator implemented for source component ftype: "${sourceComponent.ftype}"`,
          )
      }
    }

    // Finally, inflate source ports (group ports)
    const sourcePorts = injectionDb.source_port.list()
    for (const sourcePort of sourcePorts) {
      inflateSourcePort(sourcePort, inflationCtx)
    }
  }
}
