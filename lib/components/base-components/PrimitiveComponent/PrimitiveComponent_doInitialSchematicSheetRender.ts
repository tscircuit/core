import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import { updateMissingSchematicSheetWarning } from "lib/utils/schematic/update-missing-schematic-sheet-warning"
import type { PrimitiveComponent } from "./PrimitiveComponent"

export const PrimitiveComponent_doInitialSchematicSheetRender = (
  component: PrimitiveComponent,
): void => {
  if (!(component.parent as IsolatedCircuit | null)?.isRootCircuit) return
  const root = component.root
  if (!root) return

  updateMissingSchematicSheetWarning({
    db: root.db,
    schematicDisabled: root.schematicDisabled,
  })
}

export const PrimitiveComponent_updateSchematicSheetRender = (
  component: PrimitiveComponent,
): void => {
  PrimitiveComponent_doInitialSchematicSheetRender(component)
}
