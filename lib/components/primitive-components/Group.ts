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
    if (!this.isSubcircuit) return
    const props = this._parsedProps as SubcircuitGroupProps
    if (!props.schAutoLayoutEnabled) return
    const { db } = this.root!

    const descendants = this.getDescendants()

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

    // TODO only move components that belong to this subcircuit
    const scene = SAL.convertSoupToScene(db.toArray())

    const laidOutScene = SAL.ascendingCentralLrBug1(scene)

    // This method doesn't shift ports properly- it assumes ports are on the
    // edges of components (they're not, they're slightly outside)
    // SAL.mutateSoupForScene(db.toArray(), laidOutScene)

    // Shift components and ports appropriately
    // TODO use SAL.mutateSoupForScene when it's fixed
    for (const ogBox of scene.boxes) {
      const schematic_component_id = ogBox.box_id
      const laidOutBox = laidOutScene.boxes.find(
        (b) => b.box_id === schematic_component_id,
      )
      if (!laidOutBox) continue

      const delta = {
        x: laidOutBox.x - ogBox.x,
        y: laidOutBox.y - ogBox.y,
      }

      db.schematic_component.update(schematic_component_id, {
        center: {
          x: ogBox.x + delta.x,
          y: ogBox.y + delta.y,
        },
      })

      // Shift all the ports
      const ports = db.schematic_port
        .list()
        .filter((p) => p.schematic_component_id === schematic_component_id)

      for (const port of ports) {
        db.schematic_port.update(port.schematic_port_id!, {
          center: {
            x: port.center.x + delta.x,
            y: port.center.y + delta.y,
          },
        })
      }
    }
  }
}
