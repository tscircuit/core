import { Group } from "./Group"

/**
 * Render all traces within this subcircuit
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.isSubcircuit) return
  if (group.root?.schematicDisabled) return

  const traces = group.selectAll("trace")

  console.log(traces)
}
