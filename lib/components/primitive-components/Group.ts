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
import type { SchematicComponent } from "circuit-json"

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
    // TODO move subcircuits as a group, don't re-layout subcircuits
    for (const descendant of descendants) {
      if ("schematic_component_id" in descendant) {
        const component = db.schematic_component.get(
          descendant.schematic_component_id!,
        )
        if (component) {
          components.push(component)
        }
      }
    }
  }
}
