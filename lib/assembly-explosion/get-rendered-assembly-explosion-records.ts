import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { resolveAssemblyExplosionRecords } from "./resolve-assembly-explosion-records"

/** Resolve against settled CAD and stage identities allocated by the prior phase. */
export function getRenderedAssemblyExplosionRecords(
  component: PrimitiveComponent,
) {
  const root = component.root!
  return resolveAssemblyExplosionRecords(
    root.children,
    root.db.toArray(),
    (stage) => {
      if (!stage.cad_explosion_stage_id)
        throw new Error(
          `Explosion stage "${stage.name}" has not rendered its identity`,
        )
      return stage.cad_explosion_stage_id
    },
  )
}
