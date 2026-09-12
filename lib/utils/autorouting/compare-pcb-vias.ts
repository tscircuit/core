import type { PcbVia } from "circuit-json"

type PcbViaPhysicalIdentity = Pick<
  PcbVia,
  | "x"
  | "y"
  | "hole_diameter"
  | "outer_diameter"
  | "layers"
  | "subcircuit_id"
  | "subcircuit_connectivity_map_key"
>

const PCB_VIA_PHYSICAL_MATCH_TOLERANCE_MM = 1e-6

/**
 * Returns whether two vias represent the same physical plated hole.
 *
 * `x` and `y` are point coordinates in the right-handed board-world frame,
 * measured in millimeters (+X right, +Y top, +Z above the board). PCB layers
 * describe the Z-axis span. These are positions rather than direction vectors,
 * and no transform is applied.
 */
export function pcbViasSharePhysicalHole(
  firstPcbVia: PcbViaPhysicalIdentity,
  secondPcbVia: PcbViaPhysicalIdentity,
): boolean {
  if (
    !firstPcbVia.subcircuit_connectivity_map_key ||
    firstPcbVia.subcircuit_connectivity_map_key !==
      secondPcbVia.subcircuit_connectivity_map_key ||
    firstPcbVia.subcircuit_id !== secondPcbVia.subcircuit_id
  ) {
    return false
  }

  const firstPcbViaLayers = firstPcbVia.layers.toSorted()
  const secondPcbViaLayers = secondPcbVia.layers.toSorted()
  return (
    Math.abs(firstPcbVia.x - secondPcbVia.x) <=
      PCB_VIA_PHYSICAL_MATCH_TOLERANCE_MM &&
    Math.abs(firstPcbVia.y - secondPcbVia.y) <=
      PCB_VIA_PHYSICAL_MATCH_TOLERANCE_MM &&
    Math.abs(firstPcbVia.hole_diameter - secondPcbVia.hole_diameter) <=
      PCB_VIA_PHYSICAL_MATCH_TOLERANCE_MM &&
    Math.abs(firstPcbVia.outer_diameter - secondPcbVia.outer_diameter) <=
      PCB_VIA_PHYSICAL_MATCH_TOLERANCE_MM &&
    firstPcbViaLayers.length === secondPcbViaLayers.length &&
    firstPcbViaLayers.every(
      (firstPcbViaLayer, pcbViaLayerIndex) =>
        firstPcbViaLayer === secondPcbViaLayers[pcbViaLayerIndex],
    )
  )
}
