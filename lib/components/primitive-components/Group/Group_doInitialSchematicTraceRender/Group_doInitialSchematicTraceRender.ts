import { Group } from "../Group"
import {
  SchematicTracePipelineSolver,
  type InputChip,
  type InputPin,
  type InputProblem,
} from "@tscircuit/schematic-trace-solver"

/**
 * Render all traces within this subcircuit
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.isSubcircuit) return
  if (group.root?.schematicDisabled) return

  const { db } = group.root!

  const traces = group.selectAll("trace")
  const childGroups = group.selectAll("group") as Group<any>[]

  const allSchematicGroupIds = [
    group.schematic_group_id,
    ...childGroups.map((a) => a.schematic_group_id),
  ]

  const schematicComponents = db.schematic_component
    .list()
    .filter((a) => allSchematicGroupIds.includes(a.schematic_group_id!))

  const chips: InputChip[] = []

  for (const schematicComponent of schematicComponents) {
    const chipId = schematicComponent.schematic_component_id

    const pins: InputPin[] = []

    const schematicPorts = db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })

    for (const schematicPort of schematicPorts) {
      const pinId = schematicPort.schematic_port_id

      pins.push({
        pinId,
        x: schematicPort.center.x,
        y: schematicPort.center.y,
      })
    }

    chips.push({
      chipId,
      center: schematicComponent.center,
      width: schematicComponent.size.width,
      height: schematicComponent.size.height,
      pins,
    })
  }

  const inputProblem: InputProblem = {
    chips,
    directConnections: [
      // TODO
      // {
      //   pinIds: ["...", "..."], // MAX 2
      //   netId: "..." // optional, usually undefined
      // }
    ],
    netConnections: [
      // TODO
      // {
      //   netId: "...",
      //   pinIds: ["...", "..."]
      // }
    ],
    availableNetLabelOrientations: {},
  }

  const solver = new SchematicTracePipelineSolver(inputProblem)

  console.log(traces)
}
