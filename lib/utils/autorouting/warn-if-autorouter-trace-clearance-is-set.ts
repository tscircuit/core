import type { AutorouterProp } from "@tscircuit/props"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export function warnIfAutorouterTraceClearanceIsSet(
  component: PrimitiveComponent,
  autorouter: AutorouterProp | undefined,
) {
  if (typeof autorouter !== "object" || autorouter.traceClearance === undefined)
    return

  component.root!.db.source_property_ignored_warning.insert({
    source_component_id: component.source_component_id ?? "",
    subcircuit_id: component.getSubcircuit().subcircuit_id ?? undefined,
    property_name: "autorouter.traceClearance",
    error_type: "source_property_ignored_warning",
    message: `autorouter.traceClearance on <${component.lowercaseComponentName}> is deprecated. Set minTraceToPadEdgeClearance on <board> or <autoroutingphase> instead.`,
  })
}
