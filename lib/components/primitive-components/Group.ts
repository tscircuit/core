import {
  groupProps,
  type GroupProps,
  type SubcircuitGroupProps,
} from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { compose, identity } from "transformation-matrix"
import { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent"
import { TraceHint } from "./TraceHint"
import type { SchematicComponent, SchematicPort } from "circuit-json"
import * as SAL from "@tscircuit/schematic-autolayout"

export class Group<
  Props extends z.ZodType<any, any, any> = typeof groupProps,
> extends NormalComponent<Props> {
  get config() {
    return {
      zodProps: groupProps as unknown as Props,
      componentName: "Group",
    }
  }

  doInitialCreateTraceHintsFromProps(): void {
    const { _parsedProps: props } = this
    const { db } = this.root!

    const groupProps = props as SubcircuitGroupProps

    if (!this.isSubcircuit) return

    const manualTraceHints = groupProps.layout?.manual_trace_hints

    if (!manualTraceHints) return

    for (const manualTraceHint of manualTraceHints) {
      this.add(
        new TraceHint({
          for: manualTraceHint.pcb_port_selector,
          offsets: manualTraceHint.offsets,
        }),
      )
    }
  }

  doInitialSchematicLayout(): void {
    // The schematic_components are rendered in our children
    const { db } = this.root!

    const descendants = this.getDescendants()
    console.log("descendants.length", descendants.length)

    const components: SchematicComponent[] = []
    const ports: SchematicPort[] = []
    // TODO move subcircuits as a group, don't re-layout subcircuits
    for (const descendant of descendants) {
      if ("schematic_component_id" in descendant) {
        const component = db.schematic_component.get(
          descendant.schematic_component_id!,
        )
        if (component) {
          // Get all ports associated with this component
          const schPorts = db.schematic_port
            .list()
            .filter(
              (p) =>
                p.schematic_component_id === component.schematic_component_id,
            )

          components.push(component)
          ports.push(...schPorts)
        }
      }
    }

    console.table(
      db.toArray().map((a: any) => ({
        type: a.type,
        name: a.name,
      })),
    )

    const scene = SAL.convertSoupToScene(db.toArray())
    console.log("scene", scene)

    const laidOutScene = SAL.ascendingCentralLrBug1(scene)
    console.log("laidOutScene", laidOutScene)

    SAL.mutateSoupForScene(db.toArray(), laidOutScene)
    // for (const box of scene.boxes) {
    //   const component = db.schematic_component.get(box.box_id)
    //   if (component) {
    //     // TODO also move ports
    //     component.center.x = box.x
    //     component.center.y = box.y
    //   }
    // }

    console.table(
      db.toArray().map((a: any) => ({
        type: a.type,
        id: a[`${a.type}_id`],
        name: a.name,
        x: a.x ?? a.center?.x,
        y: a.y ?? a.center?.y,
      })),
    )
  }
}
