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
import { inflateSourceDiode } from "./inflators/inflateSourceDiode"
import { inflateSourceTrace } from "./inflators/inflateSourceTrace"
import { inflatePcbComponent } from "./inflators/inflatePcbComponent"
import { Chip } from "lib/components/normal-components/Chip"

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
        case "simple_diode":
          inflateSourceDiode(sourceComponent, inflationCtx)
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

    const sourcePorts = injectionDb.source_port.list()
    for (const sourcePort of sourcePorts) {
      inflateSourcePort(sourcePort, inflationCtx)
    }

    const sourceTraces = injectionDb.source_trace.list()
    for (const sourceTrace of sourceTraces) {
      inflateSourceTrace(sourceTrace, inflationCtx)
    }

    // Handle PCB components that don't have corresponding source components
    // This can happen when loading circuit JSON from external sources (like KiCad)
    // that only contain PCB data without schematic/source data
    const pcbComponents = injectionDb.pcb_component.list()

    for (const pcbComponent of pcbComponents) {
      // Check if this pcb_component has a corresponding source_component with an ftype
      // Some circuit JSONs use the pcb_component_id as the source_component_id for ports
      // but don't have an actual source_component element with that ID
      const hasSourceComponentWithFtype = sourceComponents.some(
        (sc) =>
          "source_component_id" in sc &&
          (sc.source_component_id === pcbComponent.source_component_id ||
            sc.source_component_id === pcbComponent.pcb_component_id),
      )

      // Check if there are ports that reference this PCB component as their source
      const hasPortsReferencingThis = injectionDb.source_port
        .list()
        .some(
          (port) =>
            "source_component_id" in port &&
            port.source_component_id === pcbComponent.pcb_component_id,
        )

      // Inflate if this PCB component doesn't have a corresponding source component
      // but has ports that reference it
      if (!hasSourceComponentWithFtype && hasPortsReferencingThis) {
        // Extract component name from associated ports
        const componentPorts = injectionDb.source_port
          .list()
          .filter(
            (port) =>
              "source_component_id" in port &&
              port.source_component_id === pcbComponent.pcb_component_id,
          )

        // Try to extract component name from port names (e.g., "R1.1" -> "R1")
        let componentName = pcbComponent.pcb_component_id
        if (componentPorts.length > 0 && componentPorts[0].name) {
          const match = componentPorts[0].name.match(/^([^.]+)\./)
          if (match) {
            componentName = match[1]
          }
        }

        // Create a generic chip component to hold the PCB primitives
        const placeholderComponent = new Chip({
          name: componentName,
        })

        // Inflate the PCB elements for this component
        inflatePcbComponent(pcbComponent, {
          ...inflationCtx,
          normalComponent: placeholderComponent,
        })

        // Add to subcircuit
        this.add(placeholderComponent)
      }
    }
  }
}
