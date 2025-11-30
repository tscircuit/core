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
import { distance } from "circuit-json"
import { inflateSourceTransistor } from "./inflators/inflateSourceTransistor"
export class Subcircuit extends Group<typeof subcircuitProps> {
  pcb_board_id: string | null = null
  source_board_id: string | null = null

  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  get config() {
    return {
      componentName: "Subcircuit",
      zodProps: subcircuitProps,
    }
  }

  get isSubcircuit() {
    return true
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
        case "simple_transistor":
          inflateSourceTransistor(sourceComponent, inflationCtx)
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
  }

  doInitialSourceRender() {
    const { db } = this.root!
    if (!this.source_component_id) {
      const source_component = db.source_component.insert({
        ftype: "simple_chip",
        name: this.name,
      })
      this.source_component_id = source_component.source_component_id
    }
    super.doInitialSourceRender()

    if (this.parent?.componentName === "Panel") {
      const { db } = this.root!

      const source_board = db.source_board.insert({
        source_group_id: this.source_group_id!,
        title: this.props.name,
      })

      this.source_board_id = source_board.source_board_id
    }
  }

  doInitialPcbComponentRender() {
    if (
      this.parent?.componentName === "Panel" &&
      this._parsedProps.circuitJson
    ) {
      const injectionDb = cju(this._parsedProps.circuitJson)
      const boardsInJson = injectionDb.pcb_board.list()

      if (boardsInJson.length > 1) {
        this.renderError(
          "Subcircuits inside panels can only have one board in their circuitJson",
        )
        return
      }

      if (boardsInJson.length === 1) {
        const boardInJson = boardsInJson[0]!
        const { db } = this.root!

        const { pcb_board_id: _pcb_board_id, ...boardInJsonProps } = boardInJson
        const pcb_board = db.pcb_board.insert({
          ...boardInJsonProps,
          // position it based on subcircuit props
          center: {
            x:
              this.props.pcbX !== undefined
                ? distance.parse(this.props.pcbX)
                : boardInJson.center.x,
            y:
              this.props.pcbY !== undefined
                ? distance.parse(this.props.pcbY)
                : boardInJson.center.y,
          },
        })

        this.pcb_board_id = pcb_board.pcb_board_id

        // Don't call super, to avoid creating a pcb_group
        return
      }
    }

    if (this.source_component_id) {
      const { db } = this.root!
      const pcb_component = db.pcb_component.insert({
        source_component_id: this.source_component_id,
        // These values don't matter much as they'll be overridden by layout
        // but they must be there for the component to be valid.
        center: { x: 0, y: 0 },
        width: 0.1,
        height: 0.1,
        layer: "top",
        rotation: 0,
        obstructs_within_bounds: false,
      })
      this.pcb_component_id = pcb_component.pcb_component_id
    }

    super.doInitialPcbComponentRender()

    if (this.pcb_component_id && this.pcb_group_id) {
      const { db } = this.root!
      db.pcb_component.update(this.pcb_component_id, {
        pcb_group_id: this.pcb_group_id,
      })
    }
  }
}
