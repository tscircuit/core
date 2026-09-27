import type { SchematicPortArrangement } from "@tscircuit/props"
import type { SchematicComponent } from "circuit-json"

export const getImportedSchPortArrangement = (
  schematicComponent: SchematicComponent | null,
): SchematicPortArrangement | undefined => {
  const arrangement = schematicComponent?.port_arrangement
  if (!arrangement) return undefined

  if ("left_size" in arrangement) {
    return {
      leftPinCount: arrangement.left_size,
      rightPinCount: arrangement.right_size,
      topPinCount: arrangement.top_size,
      bottomPinCount: arrangement.bottom_size,
    }
  }

  const importedArrangement: SchematicPortArrangement = {}

  if (arrangement.left_side) {
    importedArrangement.leftSide = {
      pins: arrangement.left_side.pins,
      direction: arrangement.left_side.direction ?? "top-to-bottom",
    }
  }
  if (arrangement.right_side) {
    importedArrangement.rightSide = {
      pins: arrangement.right_side.pins,
      direction: arrangement.right_side.direction ?? "top-to-bottom",
    }
  }
  if (arrangement.top_side) {
    importedArrangement.topSide = {
      pins: arrangement.top_side.pins,
      direction: arrangement.top_side.direction ?? "left-to-right",
    }
  }
  if (arrangement.bottom_side) {
    importedArrangement.bottomSide = {
      pins: arrangement.bottom_side.pins,
      direction: arrangement.bottom_side.direction ?? "left-to-right",
    }
  }

  return importedArrangement
}
